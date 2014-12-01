﻿/*global define,dojo,window,alert,esri,parent:true */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/string",
    "esri/request",
    "dojo/_base/html",
    "dojo/text!./templates/shareTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic"
], function (declare, domConstruct, lang, domAttr, on, dom, domClass, domGeom, domStyle, string, esriRequest, html, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        /**
        * create share widget
        *
        * @class
        * @name widgets/share/share
        */
        postCreate: function () {

            var applicationHeaderDiv;

            /**
            * close share panel if any other widget is opened
            * @param {string} widget Key of the newly opened widget
            */
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID !== "share") {

                    /**
                    * divAppContainer Sharing Options Container
                    * @member {div} divAppContainer
                    * @private
                    * @memberOf widgets/share/share
                    */
                    if (html.coords(this.divAppContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTImgSocialMedia", "esriCTImgSocialMediaSelected");
                        domClass.replace(this.divAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                        domClass.replace(this.divAppContainer, "esriCTZeroHeight", "esriCTFullHeight");
                    }
                } else {
                    if (domClass.contains(this.divAppContainer, "esriCTHideContainerHeight")) {
                        this._setShareContainerHeight();
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.shareTooltips, "class": "esriCTImgSocialMedia" }, null);
            applicationHeaderDiv = domConstruct.create("div", { "class": "esriCTApplicationShareicon" }, dom.byId("esriCTParentDivContainer"));
            applicationHeaderDiv.appendChild(this.divAppContainer);
            this.own(on(this.domNode, "click", lang.hitch(this, function () {

                /**
                * minimize other open header panel widgets and show share panel
                */
                topic.publish("toggleWidget", "share");
                this._shareLink();
                this._showHideShareContainer();
            })));
            on(this.imgEmbedding, "click", lang.hitch(this, function () {
                this._showEmbeddingContainer();
            }));
        },

        /**
        * set embedding container
        * @memberOf widgets/share/share
        */
        _showEmbeddingContainer: function () {
            var height;
            if (domGeom.getMarginBox(this.divShareContainer).h > 1) {
                domClass.add(this.divShareContainer, "esriCTShareBorder");
                domClass.replace(this.divShareContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            } else {
                height = domGeom.getMarginBox(this.divShareCodeContainer).h + domGeom.getMarginBox(this.divShareCodeContent).h;
                domClass.remove(this.divShareContainer, "esriCTShareBorder");
                domClass.replace(this.divShareContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domStyle.set(this.divShareContainer, "height", height + "px");
            }
            this._setShareContainerHeight(height);
        },

        _setShareContainerHeight: function (embContainerHeight) {
            var contHeight = domStyle.get(this.divAppHolder, "height");
            if (domClass.contains(this.divShareContainer, "esriCTShowContainerHeight")) {
                if (embContainerHeight) {
                    contHeight += embContainerHeight;
                } else {
                    contHeight += domStyle.get(this.divShareContainer, "height");
                }
            }
            domStyle.set(this.divAppContainer, "height", contHeight + 60 + "px");
        },
        /**
        * display sharing panel
        * @param {array} dojo.configData.MapSharingOptions Sharing option settings specified in configuration file
        * @memberOf widgets/share/share
        */
        _shareLink: function () {
            var mapExtent, url, urlStr, encodedUri, clickCoords, eventIndex, geolocationCoords, eventCoords = "";
            /**
            * get current map extent to be shared
            */
            if (domGeom.getMarginBox(this.divShareContainer).h <= 1) {
                domClass.add(this.divShareContainer, "esriCTShareBorder");
            }
            this.divShareCodeContent.value = "<iframe width='100%' height='100%' src='" + location.href + "'></iframe> ";
            domAttr.set(this.divShareCodeContainer, "innerHTML", sharedNls.titles.webpageDisplayText);
            mapExtent = this._getMapExtent();
            url = esri.urlToObject(window.location.toString());
            urlStr = encodeURI(url.path) + "?extent=" + mapExtent;

            if (dojo.addressLocation) {
                urlStr += "$address=" + dojo.addressLocation;
            }
            if (dojo.mapClickedPoint) {
                clickCoords = dojo.mapClickedPoint.x + "," + dojo.mapClickedPoint.y;
                urlStr += "$mapClickPoint=" + clickCoords;
            }
            if (dojo.infowindowDirection) {
                urlStr += "$infowindowDirection=" + dojo.infowindowDirection.toString();
            }
            if (dojo.activitySearch) {
                urlStr += "$activitySearch=" + dojo.activitySearch.join(",");
            }
            if (dojo.isShowPod && dojo.isShowPod.toString() === "false") {
                urlStr += "$isShowPod=" + dojo.isShowPod.toString();
            }
            if (dojo.doQuery) {
                urlStr += "$doQuery=" + dojo.doQuery.toString();
            }
            if (dojo.searchFacilityIndex >= 0) {
                urlStr += "$selectedSearchResult=" + dojo.searchFacilityIndex;
            }
            if (dojo.selectedBasemapIndex !== null) {
                urlStr += "$selectedBasemapIndex=" + dojo.selectedBasemapIndex;
            }
            if (dojo.addressLocationDirectionActivity) {
                urlStr += "$addressLocationDirectionActivity=" + dojo.addressLocationDirectionActivity.toString();
            }
            if (dojo.sharedGeolocation) {
                if (dojo.sharedGeolocation === "false") {
                    geolocationCoords = dojo.sharedGeolocation.toString();
                } else {
                    geolocationCoords = dojo.sharedGeolocation.geometry.x.toString() + "," + dojo.sharedGeolocation.geometry.y.toString();
                }
                urlStr += "$sharedGeolocation=" + geolocationCoords;
            }
            if (dojo.addressLocationDirection) {
                urlStr += "$addressLocationDirection=" + dojo.addressLocationDirection.toString();
            }
            if (dojo.eventInfoWindowData) {
                urlStr += "$eventInfoWindowData=" + dojo.eventInfoWindowData.x.toString() + "," + dojo.eventInfoWindowData.y.toString();
            }
            if (dojo.eventInfoWindowAttribute) {
                urlStr += "$eventInfoWindowAttribute=" + dojo.eventInfoWindowAttribute;
            }
            if (dojo.infoRoutePoint) {
                urlStr += "$infoRoutePoint=" + dojo.infoRoutePoint.toString();
            }
            if (dojo.eventForListClicked) {
                urlStr += "$eventRouteforList=" + dojo.eventForListClicked.toString();
            }
            if (dojo.eventRoutePoint) {
                urlStr += dojo.eventRoutePoint.toString();
            }
            if (dojo.eventPlannerQuery) {
                eventIndex = "";
                if (dojo.eventIndex) {
                    eventIndex = dojo.eventIndex.toString();
                }
                if (dojo.eventRoutePoint) {
                    eventCoords = dojo.eventRoutePoint.toString();
                }
                if (dojo.eventForListClicked) {
                    urlStr += "$eventRouteforList=" + dojo.eventForListClicked.toString();
                }
                urlStr += "$eventplanner=" + "true" + "$startDate=" + dojo.eventPlannerQuery.split(",")[0].replace(new RegExp(" ", 'g'), ",").toString() + "$endDate=" + dojo.eventPlannerQuery.split(",")[1].replace(new RegExp(" ", 'g'), ",").toString() + "$eventIndex=" + eventIndex + "$eventRoutePoint=" + eventCoords;
            }
            urlStr += "$extentChanged=true";
            try {
                /**
                * call tinyurl service to generate share URL
                */
                encodedUri = encodeURIComponent(urlStr);
                url = string.substitute(dojo.configData.MapSharingOptions.TinyURLServiceURL, [encodedUri]);
                esriRequest({
                    url: url
                }, {
                    useProxy: true
                }).then(lang.hitch(this, function (response) {
                    var tinyUrl, tinyResponse;
                    tinyResponse = response.data;
                    if (tinyResponse) {
                        tinyUrl = tinyResponse.url;
                    }
                    this._displayShareContainer(tinyUrl, urlStr);
                }), lang.hitch(this, function (error) {
                    alert(sharedNls.errorMessages.shareLoadingFailed);
                    this._displayShareContainer(null, urlStr);
                }));
            } catch (err) {
                alert(sharedNls.errorMessages.shareLoadingFailed);
                this._displayShareContainer(null, urlStr);
            }

        },

        /* show and hide share container
        * @memberOf widgets/share/share
        */
        _showHideShareContainer: function (tinyUrl, urlStr) {
            if (html.coords(this.divAppContainer).h > 0) {
                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.replace(this.domNode, "esriCTImgSocialMedia", "esriCTImgSocialMediaSelected");
                domClass.replace(this.divAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.replace(this.divAppContainer, "esriCTZeroHeight", "esriCTFullHeight");
            } else {
                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTImgSocialMediaSelected", "esriCTImgSocialMedia");
                domClass.replace(this.divAppContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.divAppContainer, "esriCTFullHeight", "esriCTZeroHeight");
            }
        },

        /**
        * share container
        * @memberOf widgets/share/share
        */
        _displayShareContainer: function (tinyUrl, urlStr) {

            /**
            * remove event handlers from sharing options
            */
            if (this.facebookHandle) {
                this.facebookHandle.remove();
                this.twitterHandle.remove();
                this.emailHandle.remove();
            }
            /**
            * add event handlers to sharing options
            */
            this.facebookHandle = on(this.tdFacebook, "click", lang.hitch(this, function () { this._share("facebook", tinyUrl, urlStr); }));
            this.twitterHandle = on(this.tdTwitter, "click", lang.hitch(this, function () { this._share("twitter", tinyUrl, urlStr); }));
            this.emailHandle = on(this.tdMail, "click", lang.hitch(this, function () { this._share("email", tinyUrl, urlStr); }));
        },

        /**
        * return current map extent
        * @return {string} Current map extent
        * @memberOf widgets/share/share
        */
        _getMapExtent: function () {
            var extents;
            extents = Math.round(this.map.extent.xmin).toString() + "," + Math.round(this.map.extent.ymin).toString() + "," + Math.round(this.map.extent.xmax).toString() + "," + Math.round(this.map.extent.ymax).toString();
            return extents;
        },

        /**
        * share application detail with selected share option
        * @param {string} site Selected share option
        * @param {string} tinyUrl Tiny URL for sharing
        * @param {string} urlStr Long URL for sharing
        * @memberOf widgets/share/share
        */
        _share: function (site, tinyUrl, urlStr) {
            /*
            * hide share panel once any of the sharing options is selected
            */
            if (html.coords(this.divAppContainer).h > 0) {
                domClass.replace(this.divAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.add(this.divAppContainer, "esriCTZeroHeight");
            }
            try {
                if (tinyUrl) {
                    this._shareOptions(site, tinyUrl);
                } else {
                    this._shareOptions(site, urlStr);
                }
            } catch (err) {
                alert(sharedNls.errorMessages.shareFailed);
            }
        },

        /**
        * generate sharing URL and share with selected share option
        * @param {string} site Selected share option
        * @param {string} url URL for sharing
        * @memberOf widgets/share/share
        */
        _shareOptions: function (site, url) {
            domClass.replace(this.domNode, "esriCTImgSocialMedia", "esriCTImgSocialMediaSelected");
            switch (site) {
            case "facebook":
                window.open(string.substitute(dojo.configData.MapSharingOptions.FacebookShareURL, [url]));
                break;
            case "twitter":
                window.open(string.substitute(dojo.configData.MapSharingOptions.TwitterShareURL, [url]));
                break;
            case "email":
                parent.location = string.substitute(dojo.configData.MapSharingOptions.ShareByMailLink, [url]);
                break;
            }
        }
    });
});
