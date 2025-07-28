/* Magic Mirror
 * Module: MMM-dialamoon
 *
 * By Knur
 *
 */
const NodeHelper = require('node_helper');
var axios = require('axios');
var SunCalc = require('suncalc3');


module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node_helper for: " + this.name);
    },

    getdialamoon: function(url) {
        var self = this;
		axios({
			url: self.config.apiPath+self.myDateISO, 
			baseURL: self.config.baseUrl,
			method: 'get'
		})
		.then(function (response) {
            // console.log(response.statusCode);
			if(response.status == 200 && response.data) {
			    // console.log(response.data); 
                
                MoonIllumination = SunCalc.getMoonIllumination(self.myDate);
                MoonIllumination.dialamoonapi = response.data;
                // console.log(MoonIllumination); 
				self.sendSocketNotification("DIALAMOON_RESULT", MoonIllumination);
                // self.sendSocketNotification("DIALAMOON_RESULT", response.data);
			} else {
				self.sendSocketNotification("DIALAMOON_ERROR", 'NASA API error: ' + response.statusText);
			}
		})
		.catch(function (error) {
			self.sendSocketNotification("DIALAMOON_ERROR", error.message);
		});
	},


    socketNotificationReceived: function(notification, payload) {
        var self = this;
        if (notification === 'GET_DIALAMOON') {
            self.config = payload;
            // console.log(payload); 
            self.myDate = new Date();
            self.myDateISO = self.myDate.toISOString().split(".")[0].slice(0,-3);
            self.getdialamoon();
        }
    }



});
