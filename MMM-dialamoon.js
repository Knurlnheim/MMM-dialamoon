/* Magic Mirror
 * Module: MMM-dialamoon
 *
 * By Knur
 *
 */
Module.register("MMM-dialamoon", {

    // Module config defaults.
    defaults: {
        useHeader: false, // true if you want a header
        maxWidth: "300px",
        initialLoadDelay: 10000,
        animationSpeed: 1000, //
        retryDelay: 2500,
        updateInterval: 60 * 60 * 1000, // 60 minutes
    },

    getStyles: function() {
        return ["MMM-dialamoon.css"];
    },

    getTranslations: function() {
        return {
            en: "translations/en.json",
            fr: "translations/fr.json",
            es: "translations/es.json",
            de: "translations/de.json",
            sv: "translations/sv.json",
            nl: "translations/nl.json",
            gl: "translations/gl.json",
            ca: "translations/ca.json",
        };
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        Log.info("updateInterval: " + this.config.updateInterval);
        requiresVersion: "2.1.0",
        this.loaded = false
        this.activeItem = 0;
        this.scheduleUpdate(this.config.initialLoadDelay);
    },

    getDom: function() {

        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = this.config.maxWidth;

        if (!this.loaded) {
            wrapper.innerHTML = this.translate("Contacting NASA...");
            wrapper.classList.add("dimmed", "light", "small");
            return wrapper;
        }

        if (this.config.useHeader != false) {
            var header = document.createElement("header");
            header.classList.add("xsmall", "bright", "light");
            header.innerHTML = this.config.header;
            wrapper.appendChild(header);
        }

        var dialamoon = this.dialamoon;

        var pic = document.createElement("div");
        var img = document.createElement("img");
        img.classList.add("photo");
        img.src = this.info.dialamoonapi.image.url;
        pic.appendChild(img);
        wrapper.appendChild(pic);
        

        var stage = document.createElement("div");
        stage.classList.add("small", "normal", "stage");
        stage.innerHTML = this.translate(this.info.phase.name);
        wrapper.appendChild(stage);

        // how much of the moon is illuminated
        var illumination = document.createElement("div");
        illumination.classList.add("xsmall", "dimmed", "illumination");
        illumination.innerHTML = this.translate("The moon is ") + Math.round(this.info.fraction * 100) + this.translate("% illuminated");
        wrapper.appendChild(illumination);


        var distance = document.createElement("div");
        distance.classList.add("xsmall", "dimmed", "distance");
        distance.innerHTML = this.translate("Distance from Earth : ") + (Math.round(this.info.dialamoonapi.distance) + '').replace(/(\d)(?=(\d{3})+$)/g, '$1 ') + " km";
        wrapper.appendChild(distance);
        
        // how old the current moon is
        var age = document.createElement("div");
        age.classList.add("xsmall", "dimmed", "age");
        age.innerHTML = this.translate("The current moon is ") + Math.round(this.info.dialamoonapi.age) + this.translate(" days old");
        wrapper.appendChild(age);

        // Next full moon date
        var nextFullMoon = document.createElement("div");
        nextFullMoon.classList.add("xsmall", "dimmed", "nextFullMoon");
        nextFullMoonDate = Date.parse(this.info.next.fullMoon.date)
        FullMoonDateString = new Intl.DateTimeFormat('fr-FR').format(nextFullMoonDate)
        nextFullMoon.innerHTML = this.translate("The next full moon is ") + FullMoonDateString;
        wrapper.appendChild(nextFullMoon);
    


        // Next new moon date
        var nextNewMoon = document.createElement("div");
        nextNewMoon.classList.add("xsmall", "dimmed", "nextNewMoon");
        nextNewMoonDate = Date.parse(this.info.next.newMoon.date)
        NewMoonDateString = new Intl.DateTimeFormat('fr-FR').format(nextNewMoonDate)
        nextNewMoon.innerHTML = this.translate("The next new moon is ") + NewMoonDateString;
        wrapper.appendChild(nextNewMoon);

        return wrapper;
    },

    processdialamoon: function(data) {
        this.info = data;
        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
    		this.scheduleUpdate();
    },
    
    scheduleUpdate: function(delay) {
      var nextLoad = this.config.updateInterval;
      if(typeof delay !== "undefined" && delay >= 0) {
        nextLoad = delay;
      }
      clearInterval(this.timerUpdate);
      var self = this;
      this.timerUpdate = setTimeout(function() {
        self.getdialamoon();
       }, nextLoad);
    },

    getdialamoon: function() {
        var baseUrl = "https://svs.gsfc.nasa.gov";
        var myconf = {};
        myconf.baseUrl=baseUrl;
        myconf.apiPath = "/api/dialamoon/";
        this.sendSocketNotification('GET_DIALAMOON', myconf);
        Log.info("GET_DIALAMOON sent.")
    },
 
    socketNotificationReceived: function(notification, payload) {
      switch (notification) {
        case "DIALAMOON_RESULT": 
          this.processdialamoon(payload); 
          break;
        case "DIALAMOON_ERROR": 
          Log.error(this.name + ": Did not access to data (" + payload + ").");
          this.scheduleUpdate();
          break;
      }
    },
});


/**
 * @typedef {Object} IMoonIllumination
 * @property {number} fraction - illuminated fraction of the moon; varies from `0.0` (new moon) to `1.0` (full moon)
 * @property {IPhaseObj} phase - moon phase as object
 * @property {number} phaseValue - The phase of the moon in the current cycle; varies from `0.0` to `1.0`
 * @property {number} angle - The midpoint angle in radians of the illuminated limb of the moon reckoned eastward from the north point of the disk;
 * @property {IMoonIlluminationNext} next - object containing information about the next phases of the moon
 * @remarks the moon is waxing if the angle is negative, and waning if positive
 */

/**
 * @typedef {Object} IPhaseObj
 * @property {number} from - The phase start
 * @property {number} to - The phase end
 * @property {('newMoon'|'waxingCrescentMoon'|'firstQuarterMoon'|'waxingGibbousMoon'|'fullMoon'|'waningGibbousMoon'|'thirdQuarterMoon'|'waningCrescentMoon')} id - id of the phase
 * @property {string} emoji - unicode symbol of the phase
 * @property {string} name - name of the phase
 * @property {string} id - phase name
 * @property {number} weight - weight of the phase
 * @property {string} css - a css value of the phase
 * @property {string} [nameAlt] - an alernate name (not used by this library)
 * @property {string} [tag] - additional tag (not used by this library)
 */

/**
 * @typedef {Object} IMoonIlluminationNext
 * @property {string} date - The Date as a ISO String YYYY-MM-TTTHH:MM:SS.mmmmZ of the next phase
 * @property {number} value - The Date as the milliseconds since 1.1.1970 0:00 UTC of the next phase
 * @property {string} type - The name of the next phase [newMoon, fullMoon, firstQuarter, thirdQuarter]
 * @property {IDateObj} newMoon - Date of the next new moon
 * @property {IDateObj} fullMoon - Date of the next full moon
 * @property {IDateObj} firstQuarter - Date of the next first quater of the moon
 * @property {IDateObj} thirdQuarter - Date of the next third/last quater of the moon
 */
/*
{
  fraction: 0.04801071566970411,
  phase: {
    from: 0.783863193308711,
    to: 0.966136806691289,
    id: 'waningCrescentMoon',
    emoji: '🌘',
    code: ':waning_crescent_moon:',
    name: 'Waning Crescent',
    weight: 6.3825,
    css: 'wi-moon-wan-cres'
  },
  phaseValue: 0.9296835079857706,
  angle: 1.4424298744059985,
  next: {
    value: 1704957345066,
    date: '2024-01-11T07:15:45.066Z',
    type: 'newMoon',
    newMoon: { value: 1704957345066, date: '2024-01-11T07:15:45.066Z' },
    fullMoon: { value: 1706233066455, date: '2024-01-26T01:37:46.455Z' },
    firstQuarter: { value: 1705595205760.5, date: '2024-01-18T16:26:45.760Z' },
    thirdQuarter: { value: 1706870927149.5, date: '2024-02-02T10:48:47.149Z' }
  }
}


{
  "image": {
      "id": 1052681,
      "url": "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005187/frames/730x730_1x1_30p/moon.0209.jpg",
      "filename": "frames/730x730_1x1_30p/moon.0209.jpg",
      "media_type": "Image",
      "alt_text": "An image of the moon, as it would appear on 2024-01-09 16:00:00+00:00. (Frame: 209)",
      "width": 730,
      "height": 730,
      "pixels": 532900
  },
  "image_highres": {
      "id": 1052682,
      "url": "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005187/frames/5760x3240_16x9_30p/fancy/comp.0209.tif",
      "filename": "frames/5760x3240_16x9_30p/fancy/comp.0209.tif",
      "media_type": "Image",
      "alt_text": "An image of the moon, as it would appear on 2024-01-09 16:00:00+00:00. (Frame: 209)",
      "width": 5760,
      "height": 3240,
      "pixels": 18662400
  },
  "su_image": {
      "id": 1070381,
      "url": "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005188/frames/730x730_1x1_30p/moon.0209.jpg",
      "filename": "frames/730x730_1x1_30p/moon.0209.jpg",
      "media_type": "Image",
      "alt_text": "An image of the moon, as it would appear on 2024-01-09 16:00:00+00:00. (Frame: 209)",
      "width": 730,
      "height": 730,
      "pixels": 532900
  },
  "su_image_highres": {
      "id": 1070382,
      "url": "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005188/frames/5760x3240_16x9_30p/fancy/comp.0209.tif",
      "filename": "frames/5760x3240_16x9_30p/fancy/comp.0209.tif",
      "media_type": "Image",
      "alt_text": "An image of the moon, as it would appear on 2024-01-09 16:00:00+00:00. (Frame: 209)",
      "width": 5760,
      "height": 3240,
      "pixels": 18662400
  },
  "time": "2024-01-09T16:00",
  "phase": 4.66,
  "obscuration": 0.0,
  "age": 27.686,
  "diameter": 1922.4,
  "distance": 372821.0,
  "j2000_ra": 17.5519,
  "j2000_dec": -27.7909,
  "subsolar_lon": -161.301,
  "subsolar_lat": -1.52,
  "subearth_lon": -5.923,
  "subearth_lat": 5.86,
  "posangle": 1.98
}
*/