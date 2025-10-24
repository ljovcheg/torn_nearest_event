// ==UserScript==
// @name         NearestEventTimer
// @version      1.0.1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       unsafeWindow
// @run-at      document-start
// @description  ljovcheg
// @author       ljovcheg
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==

(function () {
  'use strict';
  GM_addStyle(`
    #eventTimer {

    /* border-top: 1px solid rgba(255, 255, 255, 0.4); */
    background-color: rgba(0, 0, 0, 0.5);
    margin-top: 5px;
    margin-bottom: 5px;
    border-radius: 5px;
    padding: 5px;
    }
  `);
  let apiKey = '' //API HERE GOES HERE FOR THE FIRT TIME;

  let cached_api = GM_getValue('timer_api_key', null);
  if (console.log('CACHED API', cached_api));
  if (!cached_api){
    GM_setValue('timer_api_key', apiKey);
  }else{
    apiKey = cached_api;
  }
  let events = [];
  let userEventStartTime = null;
  let userEventStartTimeUnix = null;
  let userTimeStamp = null;
  let nearestEvent = null;

  let timerDiv = `<div id="eventTimer" style="border-top:1px solid rgba(255,255,255,0.4);">...</div>`
  let theTimer;
  function implementTimer(){
    if (!document.getElementById("eventTimer")) {
      let linkReference = document.querySelector(".tc-clock-tooltip");
      if (linkReference) {
        let p = linkReference.appendChild(document.createElement("div"));
        p.innerHTML = timerDiv;
        theTimer = document.getElementById('eventTimer');
         setTimeout(getTornEvenets, 1000);
      }
    }
  }
  function getTornEvenets(){
     GM_xmlhttpRequest({
        method: "GET",
        url: `https://api.torn.com/v2/torn/?selections=calendar&key=${apiKey}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        //data: formData,
        onload: function (response) {
          console.log(response)
          if (response && response.responseText){
            let json = JSON.parse(response.responseText);

            if (json.calendar){
              json = json.calendar;
              events = json["events"].concat(json.competitions);

              getUser();
            }else{
              theTimer.innerHTML = json.error.error
              console.log("ERROR", json)
            }
          }
        },
      });
  }
  function getUser(){
     GM_xmlhttpRequest({
        method: "GET",
        url: `https://api.torn.com/v2/user/?selections=calendar,timestamp&key=${apiKey}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        //data: formData,
        onload: function (response) {
          if (response && response.responseText){
            let json = JSON.parse(response.responseText);
            if (json.calendar) userEventStartTime = json.calendar.start_time.toLowerCase().split(" tct")[0];
            userTimeStamp = json.timestamp || null;
            calculate();
          }
        },
      });
  }
  function secondsToTime(totalSeconds) {
      // Total hours (not limited to 24)
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;

    // Minutes and seconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Pad with zero if less than 10
    const paddedHours = hours < 10 ? "0" + hours : hours;
    const paddedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const paddedSeconds = seconds < 10 ? "0" + seconds : seconds;

    return {
      hours: paddedHours,
      minutes: paddedMinutes,
      seconds: paddedSeconds,
    };
  }

  function calculate(){
    console.log(events);
    console.log(userEventStartTime)
    console.log(userTimeStamp)

    nearestEvent = getNearestEvent(events,userTimeStamp);
    if (nearestEvent){
      userEventStartTimeUnix = setTimeOnUnix(nearestEvent.start,userEventStartTime);
      doTimer();
    }
  }
  function doTimer(){
    userTimeStamp++;
    let dif = userEventStartTimeUnix - userTimeStamp;
    if (dif > 0){
      let str = secondsToTime(dif)

      theTimer.innerHTML = `
        <b>${nearestEvent.title}</b> in:<br/>
        ${str.hours}:${str.minutes}:${str.seconds}
      `
      setTimeout(doTimer, 1000);

    }

  }

  function getNearestEvent(events, current_time) {
    if (!events || events.length === 0) return null;

    let nearestEvent = events[0];
    let minDifference = Math.abs(events[0].start - current_time);

    for (let i = 1; i < events.length; i++) {
      const diff = Math.abs(events[i].start - current_time);
      if (diff < minDifference) {
        minDifference = diff;
        nearestEvent = events[i];
      }
    }

    return nearestEvent;
  }
  function setTimeOnUnix(unixTime, timeString) {
    // Split the string "HH:MM"
    const [targetHour, targetMinute] = timeString.split(":").map(Number);

    // Convert to JavaScript Date (uses local time)
    const date = new Date(unixTime * 1000);

    // Set hours and minutes
    date.setHours(targetHour);
    date.setMinutes(targetMinute);
    date.setSeconds(0);
    date.setMilliseconds(0);

    // Return back to Unix timestamp in seconds
    return Math.floor(date.getTime() / 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') {
        console.log('DOCUMENT LOADED')
        implementTimer();
      }
    });
  } else {
    console.log('DOCUMENT LOADED')
  }

})();
