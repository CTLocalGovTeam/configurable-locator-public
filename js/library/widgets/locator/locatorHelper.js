﻿/*global define,dojo,dojoConfig:true,alert,esri,console */
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
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/dom",
    "dojo/_base/array",
    "dojo/dom-class",
    "dojo/query",
    "dojo/string",
    "esri/tasks/locator",
    "esri/tasks/query",
    "../scrollBar/scrollBar",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/tasks/QueryTask",
    "esri/geometry",
    "esri/tasks/BufferParameters",
    "esri/graphic",
    "dojo/_base/Color",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/layers/GraphicsLayer",
    "esri/tasks/GeometryService",
    "esri/geometry/Point",
    "dojo/text!./templates/locatorTemplate.html",
    "widgets/searchResult/searchResult",
    "widgets/geoLocation/geoLocation",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/tasks/RouteParameters",
    "esri/tasks/RouteTask",
    "esri/tasks/FeatureSet",
    "esri/SpatialReference",
    "esri/urlUtils",
    "esri/units",
    "dojo/date",
    "dojo/NodeList-manipulate"
], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, ScrollBar, Deferred, DeferredList, QueryTask, Geometry, BufferParameters, Graphic, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, GraphicsLayer, GeometryService, Point, template, SearchResult, GeoLocation, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, RouteParameters, RouteTask, FeatureSet, SpatialReference, urlUtils, units, date) {
    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        activitySearchScrollBar: null,
        searchFacility: null,
        rankValue: 0,
        featureLayerClick: null,

        /**
        * Query layer to fetch the data
        * @param {array} candidateArray Contains array of address result data
        * @param {Object} candidate Contains address result data
        * @param {number} index store the index of address result
        * @memberOf widgets/locator/locatorHelper
        */
        _showFeatureResultsOnMap: function (candidateArray, candidate, infoIndex, index, isFeatureClicked) {
            var queryTask, queryLayer, featurePoint;
            domStyle.set(this.imgSearchLoader, "display", "block");
            domStyle.set(this.close, "display", "none");
            this.txtAddress.value = (candidate.name);
            if (candidate.layer.QueryURL) {
                queryTask = new QueryTask(candidate.layer.QueryURL);
                queryLayer = new Query();
                queryLayer.where = "1=1";
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.outFields = ["*"];
                queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                    if (featureSet.features[index].geometry.type === "point") {
                        this._createInfoWindowContent(featureSet.features[index].geometry, featureSet.features[index].attributes, featureSet.fields, infoIndex, null, this.map);
                    } else if (featureSet.features[index].geometry.type === "polyline") {
                        featurePoint = featureSet.features[index].geometry.getPoint(0, 0);
                        this._createInfoWindowContent(featurePoint, featureSet.features[index].attributes, featureSet.fields, infoIndex, null, this.map);
                    }
                }), function (err) {
                    alert(err.message);
                });
            }
        },

        /**
        * Create info window on map and populate the result
        * @param {object} geometry contains the geometry service of infoWindow
        * @param {object} attributes contains attributes of the  feature layer
        * @param {object} fields contains fields of the  feature layer
        * @param {number} infoIndex contains index of feature
        * @param {object} featureArray contains attributes of the  feature layer
        * @param {object} count indicate number of feature in infoWindow
        * @param {object} zoomToFeature contains zoom the feature when infoWindow is display
        * @memberOf widgets/locator/locatorHelper
        */
        _createInfoWindowContent: function (geometry, attributes, fields, infoIndex, featureArray, zoomToFeature) {
            var infoPopupFieldsCollection, infoPopupHeight, infoPopupWidth, divInfoDetailsTab, divInfoRow, infoTitle, mapPoint, divOprhoures, divManageUnit, contentDiv, divAccessfee, divInformationContent,
                divHeader, directionContainer, divAttributesType, commentContainer, directionInfo, divSearchText, divAddressText, featureLayerHeightLight, featureGeometryArray,
                divSearchClose, spanClose, innerSpan, imageSearchLoader, divSearchInfo, divAddressListInfo, divAddressScrollContainerInfo,
                divAddressScrollContentInfo, divAddressResult, infoWindowParams, infoWindowDirectionContainer, directionMainContainer;
            mapPoint = this._getMapPoint(geometry);
            this.featureLayerClick = null;
            featureLayerHeightLight = [];
            if (featureArray.length && featureArray.length > 0) {
                this.featureLayerClick = featureArray[0].attr;
            } else {
                this.featureLayerClick = featureArray;
            }
            featureLayerHeightLight.push(this.featureLayerClick);
            topic.publish("highlightFeature", featureLayerHeightLight, 0);
            featureGeometryArray = [];
            featureGeometryArray.push(featureArray);

            if (dojo.configData.InfoWindowSettings[0] && dojo.configData.InfoWindowSettings[0].InfoWindowData) {
                infoPopupFieldsCollection = dojo.configData.InfoWindowSettings[0].InfoWindowData;
                divInfoDetailsTab = domConstruct.create("div", { "class": "esriCTInfoDetailsTab" }, null);
                this.divInfoDetailsContainer = domConstruct.create("div", { "class": "esriCTInfoDetailsContainer" }, divInfoDetailsTab);
            } else {
                divInfoDetailsTab = domConstruct.create("div", { "class": "esriCTInfoDetailsTab" }, null);
            }
            infoPopupHeight = dojo.configData.InfoPopupHeight;
            infoPopupWidth = dojo.configData.InfoPopupWidth;
            /*InformationTab*/
            if (dojo.byId("informationTabContainer")) {
                domConstruct.empty(dojo.byId("informationTabContainer"));
            }
            divInfoRow = domConstruct.create("div", {}, dojo.byId("informationTabContainer"));
            divInformationContent = domConstruct.create("div", { "class": "esriCTInfoWindoContainer" }, divInfoRow);
            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divInformationContent);
            domConstruct.create("div", { "class": "esriCTheadText", "innerHTML": sharedNls.titles.facilityInfo }, divInformationContent);
            contentDiv = domConstruct.create("div", { "class": "esriCTDivclear" }, divInformationContent);
            divAccessfee = domConstruct.create("div", { "class": "esriCTInfotext" }, contentDiv);
            domConstruct.create("span", { "class": "esriCTFirstChild", "innerHTML": sharedNls.titles.facitilyPanelAccessFeeText }, divAccessfee);
            domConstruct.create("span", { "innerHTML": attributes.ACCESSFEE }, divAccessfee);
            divOprhoures = domConstruct.create("div", { "class": "esriCTInfotext" }, contentDiv);
            domConstruct.create("span", { "class": "esriCTFirstChild", "innerHTML": sharedNls.titles.facitilyPanelHoursOpenForText }, divOprhoures);
            domConstruct.create("span", { "innerHTML": attributes.OPERHOURS }, divOprhoures);
            divManageUnit = domConstruct.create("div", { "class": "esriCTInfotext" }, contentDiv);
            domConstruct.create("span", { "class": "esriCTFirstChild", "innerHTML": sharedNls.titles.facitilyPanelManagementUnitText }, divManageUnit);
            domConstruct.create("span", { "innerHTML": attributes.MANAGEUNIT }, divManageUnit);
            divAttributesType = domConstruct.create("div", { "class": "esriCTInfotext" }, contentDiv);
            domConstruct.create("span", { "class": "esriCTFirstChild", "innerHTML": sharedNls.titles.facitilyPanelMarinaText }, divAttributesType);
            domConstruct.create("span", { "innerHTML": attributes.Type }, divAttributesType);
            /* CommentsTab */
            if (dojo.configData.CommentsLayer.Visibility) {
                if (dojo.byId("commentsTabContainer")) {
                    domConstruct.empty(dojo.byId("commentsTabContainer"));
                }
                this.OuterCommentContainer = domConstruct.create("div", { "class": "esriCTCommentInfoOuterContainer" }, dojo.byId("commentsTabContainer"));
                commentContainer = domConstruct.create("div", { "class": "esriCTCommentContainer" }, this.OuterCommentContainer);
                this.divContentDiv = domConstruct.create("div", {}, commentContainer);
                this._queryCommentLayer(null, null, attributes, null, mapPoint, commentContainer);
            }
            /* gallery Tab*/
            if (this.galleryContainer) {
                domConstruct.destroy(this.galleryContainer);
            }
            this.galleryContainer = domConstruct.create("div", { "class": "esriCTGalleryInfoContainer" }, dojo.byId("galleryTabContainer"));
            this._queryForGallery(attributes.OBJECTID);
            /*direction tab*/
            if (dojo.byId("getDirContainer")) {
                domConstruct.empty(dojo.byId("getDirContainer"));
            }
            directionMainContainer = domConstruct.create("div", { "class": "esriCTDirectionMainContainer" }, dojo.byId("getDirContainer"));
            directionContainer = domConstruct.create("div", { "class": "esriCTDirectionContainerInfo" }, directionMainContainer);
            directionInfo = domConstruct.create("div", { "class": "esriCTDirectionInfo" }, directionContainer);
            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainerInfo" }, directionInfo);
            domConstruct.create("div", { "class": "esriCTheadText", "innerHTML": sharedNls.titles.directionText + " " + attributes.NAME }, divHeader);
            infoWindowDirectionContainer = domConstruct.create("div", { "class": "esriCTdirectionSearchContainer" }, directionContainer);
            divSearchText = domConstruct.create("div", { "class": "esriCTsearchTextInner" }, infoWindowDirectionContainer);
            divAddressText = domConstruct.create("input", { "class": "esriCTTxtAddress", "type": "text" }, divSearchText);
            divSearchClose = domConstruct.create("div", { "class": "esriCTSearchClose" }, infoWindowDirectionContainer);
            spanClose = domConstruct.create("div", { "class": "esriCTClearInput", "title": sharedNls.tooltips.clearEntry }, divSearchClose);
            innerSpan = domConstruct.create("span", {}, divSearchClose);
            imageSearchLoader = domConstruct.create("image", { "class": "esriCTSearchLoader" }, innerSpan);
            domAttr.set(imageSearchLoader, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            divSearchInfo = domConstruct.create("div", { "class": "esriCTSearch" }, directionContainer);
            domConstruct.create("span", { "class": "esriCTSearchIcon", "title": sharedNls.tooltips.search }, divSearchInfo);
            divAddressListInfo = domConstruct.create("div", { "class": "esriCTAddressListInfoWindow" }, directionContainer);
            divAddressScrollContainerInfo = domConstruct.create("div", { "class": "esriCTAddressScrollContainer" }, divAddressListInfo);
            divAddressScrollContentInfo = domConstruct.create("div", { "class": "esriCTDirInfoScrollContent" }, divAddressScrollContainerInfo);
            divAddressResult = domConstruct.create("div", { "class": "esriCTFullWidth" }, divAddressScrollContentInfo);
            this._setDefaultTextboxValue(divAddressText);
            divAddressText.value = domAttr.get(divAddressText, "defaultAddress");
            infoWindowParams = {
                divSearch: divSearchInfo,
                divAddressContent: directionContainer,
                imgSearchLoader: imageSearchLoader,
                txtAddress: divAddressText,
                close: spanClose,
                divAddressResults: divAddressResult,
                divAddressScrollContainer: divAddressScrollContainerInfo,
                divAddressScrollContent: divAddressScrollContentInfo,
                lastSearchString: this.lastSearchStringInfoWindow,
                locatorScrollBar: this.locatorScrollbarInfoWindow,
                showBuffer: false
            };
            this._attachLocatorEvents(infoWindowParams);
            if (infoPopupFieldsCollection) {
                infoTitle = string.substitute(dojo.configData.InfoWindowSettings[0].InfoWindowData[0].FieldName, attributes);
                this._setInfoWindowZoomLevel(mapPoint, infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight, zoomToFeature);
                topic.publish("hideProgressIndicator");
            } else {
                infoTitle = sharedNls.errorMessages.emptyInfoWindowTitle;
                this._setInfoWindowZoomLevel(mapPoint, infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight, zoomToFeature);
                topic.publish("hideProgressIndicator");
            }
            if (dojo.configData.WebMapId !== null) {
                infoTitle = attributes.NAME;
                this._setInfoWindowZoomLevel(mapPoint, infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight, zoomToFeature);
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * query feature layer for images in gallery panel in infoWindow
        * @param {field} objectID is the field name in faeture layer
        * @memberOf widgets/locator/locatorHelper
        */
        _queryForGallery: function (objectID) {
            var queryTask, queryLayer, featureSet, deferredArray = [], deferredListResult;
            queryTask = new esri.tasks.QueryTask(dojo.configData.OperationalLayers[0].ServiceURL);
            queryLayer = new esri.tasks.Query();
            queryLayer.outFields = ["*"];
            queryLayer.returnGeometry = true;
            queryLayer.where = "OBJECTID=" + parseInt(objectID, 10);
            deferredArray.push(queryTask.execute(queryLayer));
            deferredListResult = new DeferredList(deferredArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result[0][0]) {
                    featureSet = result[0][1].features;
                }
                this._setGallaryForInfoWindow(featureSet);
            }));
        },

        /**
        * set the images in (Gallery) carousel pod for infoWindow
        * @param {object} featureSet contains the features
        * @memberOf widgets/locator/locatorHelper
        */
        _setGallaryForInfoWindow: function (featureSet) {
            var layerIndex, layerID;
            if (this.map._layers) {
                for (layerIndex = 0; layerIndex < dojo.configData.SearchSettings.length; layerIndex++) {
                    for (layerID in this.map._layers) {
                        if (this.map._layers.hasOwnProperty(layerID)) {
                            if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === dojo.configData.SearchSettings[layerIndex].QueryURL)) {
                                this.map._layers[layerID].queryAttachmentInfos(featureSet[0].attributes[this.map._layers[layerID].objectIdField], lang.hitch(this, this._getAttachments), this._errorLog);
                            }
                        }
                    }
                }
            }
        },

        /**
        * query on attachment and show the images on carousel pod
        * @param {object} response contain the images which are in the feature layer
        * @memberOf widgets/locator/locatorHelper
        */
        _getAttachments: function (response) {
            var divAttchmentInfo, divPreviousImgInfo, divNextImgInfo;
            this.imageCountInfo = 0;
            if (response.length > 1) {
                divPreviousImgInfo = domConstruct.create("div", { "class": "esriCTImgPrev" }, this.galleryContainer);
                divNextImgInfo = domConstruct.create("div", { "class": "esriCTImgNext" }, this.galleryContainer);
                divAttchmentInfo = domConstruct.create("img", { "class": "esriCTDivAttchmentInfo" }, this.galleryContainer);
                domAttr.set(divAttchmentInfo, "src", response[0].url);
                this.own(on(divPreviousImgInfo, "click", lang.hitch(this, this._previousImageInfo, response, divAttchmentInfo)));
                this.own(on(divNextImgInfo, "click", lang.hitch(this, this._nextImageInfo, response, divAttchmentInfo)));

            } else if (response.length === 1) {
                divAttchmentInfo = domConstruct.create("img", { "class": "esriCTDivAttchmentInfo" }, this.galleryContainer);
                domAttr.set(divAttchmentInfo, "src", response[0].url);
            } else {
                domConstruct.empty(this.galleryContainer);
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, this.galleryContainer);
            }
        },

        /**
        * change the image when click on previous arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/locator/locatorHelper
        */
        _previousImageInfo: function (response, divAttchmentInfo) {
            this.imageCountInfo--;
            if (this.imageCountInfo < 0) {
                this.imageCountInfo = response.length - 1;
            }
            domAttr.set(divAttchmentInfo, "src", response[this.imageCountInfo].url);
        },

        /**
        * change the image when click on next arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/locator/locatorHelper
        */
        _nextImageInfo: function (response, divAttchmentInfo) {
            this.imageCountInfo++;
            if (this.imageCountInfo === response.length) {
                this.imageCountInfo = 0;
            }
            domAttr.set(divAttchmentInfo, "src", response[this.imageCountInfo].url);
        },

        /**
        * Console error
        * @param {error} error
        * @memberOf widgets/locator/locatorHelper
        */
        _errorLog: function (error) {
            console.log(error);
        },

        /**
        * open infowindow link on new page
        * @memberOf widgets/locator/locatorHelper
        */
        _openDetailWindow: function () {
            var link = domAttr.get(this, "link");
            window.open(link);
        },

        /**
        * convert the UTC time stamp from Millisecond
        * @returns Date
        * @param {object} utcMilliseconds contains UTC millisecond
        * @memberOf widgets/locator/locatorHelper
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/locator/locatorHelper
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        },

        /**
        *set the zoom level an screen point and infowindow
        * @param {mapPoint}
        * @param {object} infoTitle contains infoWindow title
        * @param {object} divInfoDetailsTab contains infoWindow div tab
        * @param {object} infoPopupWidth contains InfoWindow width
        * @param {object} infoPopupHeight contains InfoWindow Height
        * @param {object} count indicate number of feature in infoWindow
        * @param {object} zoomToFeature contains zoom the feature for showing the infoWindow
        * @memberOf widgets/locator/locatorHelper
        */
        _setInfoWindowZoomLevel: function (mapPoint, infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight, zoomToFeature) {
            var extentChanged, screenPoint, zoomDeferred;
            dojo.selectedMapPoint = mapPoint;
            if (this.map.getLevel() !== dojo.configData.ZoomLevel && zoomToFeature) {
                zoomDeferred = this.map.setLevel(dojo.configData.ZoomLevel);
                zoomDeferred.then(lang.hitch(this, function () {
                    extentChanged = this.map.setExtent(this._calculateCustomMapExtent(mapPoint));
                    extentChanged.then(lang.hitch(this, function () {
                        topic.publish("hideProgressIndicator");
                        screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                        screenPoint.y = this.map.height - screenPoint.y;
                        topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight);
                    }));
                }));
            } else {
                extentChanged = this.map.setExtent(this._calculateCustomMapExtent(mapPoint));
                extentChanged.then(lang.hitch(this, function () {
                    topic.publish("hideProgressIndicator");
                    screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                    screenPoint.y = this.map.height - screenPoint.y;
                    topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight);
                }));
            }
        },

        /**
        *Fetch the geometry type of the mapPoint
        * @param {object} geometry Contains the geometry service
        * @memberOf widgets/locator/locatorHelper
        */
        _getMapPoint: function (geometry) {
            var selectedMapPoint, mapPoint, rings, points;
            if (geometry.type === "point") {
                selectedMapPoint = geometry;
            } else if (geometry.type === "polyline") {
                selectedMapPoint = geometry.getPoint(0, 0);
            } else if (geometry.type === "polygon") {
                mapPoint = geometry.getExtent().getCenter();
                if (!geometry.contains(mapPoint)) {
                    //if the center of the polygon does not lie within the polygon
                    rings = Math.floor(geometry.rings.length / 2);
                    points = Math.floor(geometry.rings[rings].length / 2);
                    selectedMapPoint = geometry.getPoint(rings, points);
                } else {
                    //if the center of the polygon lies within the polygon
                    selectedMapPoint = geometry.getExtent().getCenter();
                }
            }
            return selectedMapPoint;
        },

        /**
        *open link on new page
        * @memberOf widgets/locator/locatorHelper
        */
        _makeWindowOpenHandler: function (link) {
            return function () {
                window.open(link);
            };
        },

        /**
        *Calculate offset point to show infow window
        * @param {mapPoint}
        * @memberOf widgets/locator/locatorHelper
        */
        _calculateCustomMapExtent: function (mapPoint) {
            var width, infoWidth, height, diff, ratioHeight, ratioWidth, totalYPoint, xmin,
                ymin, xmax, ymax;

            width = this.map.extent.getWidth();
            infoWidth = (this.map.width / 2) + dojo.configData.InfoPopupWidth / 2 + 400;
            height = this.map.extent.getHeight();
            if (infoWidth > this.map.width) {
                diff = infoWidth - this.map.width;
            } else {
                diff = 0;
            }
            ratioHeight = height / this.map.height;
            ratioWidth = width / this.map.width;
            totalYPoint = dojo.configData.InfoPopupHeight + 30 + 61;
            xmin = mapPoint.x - (width / 2);
            if (dojo.window.getBox().w >= 680) {
                ymin = mapPoint.y - height + (ratioHeight * totalYPoint);
                xmax = xmin + width + diff * ratioWidth;
            } else {
                ymin = mapPoint.y - (height / 2);
                xmax = xmin + width;
            }
            ymax = ymin + height;
            return new esri.geometry.Extent(xmin, ymin, xmax, ymax, this.map.spatialReference);
        },

        /**
        * hide search panel
        * @memberOf widgets/locator/locatorHelper
        */
        _hideAddressContainer: function (locatorParams) {
            domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
            locatorParams.txtAddress.blur();
            domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
        },

        /**
        * set height of the search panel
        * @memberOf widgets/locator/locatorHelper
        */
        _setHeightAddressResults: function (locatorParams) {
            var contentHeight, addressContentHeight = domGeom.getMarginBox(this.divAddressContent).h;
            if (addressContentHeight > 0) {
                contentHeight = 20;
                domStyle.set(this.divAddressScrollContent, "style", contentHeight + "px");
            }
        },
        /**
        * display search by address tab
        * @memberOf widgets/locator/locatorHelper
        */
        _showAddressSearchView: function () {
            if (domStyle.get(this.imgSearchLoader, "display", "block") === "block") {
                return;
            }
            this.txtAddress.value = domAttr.get(this.txtAddress, "defaultAddress");
            this.lastSearchString = lang.trim(this.txtAddress.value);
            domConstruct.empty(this.divAddressResults);
        },

        /**
        * display error message if locator service fails or does not return any results
        * @memberOf widgets/locator/locatorHelper
        */
        _locatorErrBack: function (locatorParams) {
            var errorAddressCounty;
            domConstruct.empty(locatorParams.divAddressResults);
            domStyle.set(locatorParams.imgSearchLoader, "display", "none");
            domStyle.set(locatorParams.close, "display", "block");
            if (locatorParams.divAddressContent) {
                domClass.remove(locatorParams.divAddressContent, "esriCTAddressContainerHeight");
                domClass.add(locatorParams.divAddressContent, "esriCTAddressResultHeight");
            }
            errorAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTCursorPointer esriCTAddressCounty" }, locatorParams.divAddressResults);
            domAttr.set(errorAddressCounty, "innerHTML", sharedNls.errorMessages.invalidSearch);
        },

        /**
        * clear default value from search textbox
        * @param {object} evt Dblclick event
        * @memberOf widgets/locator/locatorHelper
        */
        _clearDefaultText: function (evt, locatorParams) {
            var target;
            target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            target.style.color = "#FFF";
            target.value = '';
            locatorParams.txtAddress.value = "";
            domAttr.set(locatorParams.txtAddress, "defaultAddress", locatorParams.txtAddress.value);
            domConstruct.empty(locatorParams.divAddressResults);
        },

        /**
        * set default value to search textbox
        * @param {object} evt Blur event
        * @memberOf widgets/locator/locatorHelper
        */
        _replaceDefaultText: function (evt, locatorParams) {
            var target;
            target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            this._resetTargetValue(target, "defaultAddress", locatorParams);
        },

        /**
        * set default value to search textbox
        * @param {object} target Textbox dom element
        * @param {string} title Default value
        * @memberOf widgets/locator/locatorHelper
        */
        _resetTargetValue: function (target, title) {
            if (target.value === '' && domAttr.get(target, title)) {
                target.value = target.title;
                if (target.title === "") {
                    target.value = domAttr.get(target, title);
                }
            }
            if (domClass.contains(target, "esriCTColorChange")) {
                domClass.remove(target, "esriCTColorChange");
            }
            domClass.add(target, "esriCTBlurColorChange");
            this.lastSearchString = lang.trim(this.txtAddress.value);
        },

        /**
        * show search result tap
        * @memberOf widgets/locator/locatorHelper
        */
        _showSearchTab: function () {
            domStyle.set(this.searchTextCointainer, "display", "block");
            domStyle.set(this.esriCTActivityContainer, "display", "none");
            domStyle.set(this.divAddressScrollContent, "display", "block");
            domClass.replace(this.ActivityPanel, "esriCTActivityPanel", "esriCTActivityPanelSelected");
            domClass.replace(this.SearchPanel, "esriCTSearchPanel", "esriCTSearchPanelSelected");
            domClass.replace(this.esriCTActivityContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");

        },

        /**
        * show Activity result tap
        * @memberOf widgets/locator/locatorHelper
        */
        _showActivityTab: function () {
            domStyle.set(this.searchTextCointainer, "display", "none");
            domStyle.set(this.esriCTActivityContainer, "display", "block");
            domStyle.set(this.divAddressScrollContent, "display", "none");
            domClass.replace(this.ActivityPanel, "esriCTActivityPanelSelected", "esriCTActivityPanel");
            domClass.replace(this.esriCTActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.SearchPanel, "esriCTSearchPanelSelected", "esriCTSearchPanel");
        },

        /**
        * get buffer result on map
        * @param {map point}
        * @memberOf widgets/locator/locatorHelper
        */
        _doBuffer: function (mapPoint) {
            var params, geometryService;
            geometryService = new GeometryService(dojo.configData.GeometryService);
            if (mapPoint.geometry && dojo.configData.BufferDistance) {
                params = new BufferParameters();
                params.distances = [dojo.configData.BufferDistance];
                params.unit = GeometryService.UNIT_STATUTE_MILE;
                params.bufferSpatialReference = this.map.spatialReference;
                params.outSpatialReference = this.map.spatialReference;
                params.geometries = [mapPoint.geometry];
                geometryService.buffer(params, lang.hitch(this, function (geometries) {
                    this._showBuffer(geometries, mapPoint);
                }));
            }
        },

        /**
        * show buffer result on map
        * @param {object} geometries Contains the geometry services of buffer
        * @param {mapPoint}
        * @memberOf widgets/locator/locatorHelper
        */
        _showBuffer: function (geometries, mapPoint) {
            this._clearBuffer();
            this._clearRoute();
            var self, bufferSymbol;
            self = this;
            bufferSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0], 10)]), 2
                ),
                new Color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0], 10)])
                );
            self._addGraphic(self.map.getLayer("tempBufferLayer"), bufferSymbol, geometries[0]);
            topic.publish("showProgressIndicator");
            this._queryLayer(geometries[0], mapPoint, null);
        },

        /**
        * add graphic layer on map of buffer and set expand
        * create an object of graphic
        * @param {object} layer Contains feature layer
        * @param {object} symbol Contains graphic
        * @param {map point}point Contains the map point
        * @param {object} attr Contains attributes of the feature. 
        * @memberOf widgets/locator/locatorHelper
        */
        _addGraphic: function (layer, symbol, point, attr) {
            var graphic;
            if (attr) {
                graphic = new Graphic(point, symbol, attr, null);
            } else {
                graphic = new Graphic(point, symbol, null, null);
            }
            layer.add(graphic);
            this.map.setExtent(point.getExtent().expand(1.6));
        },

        /**
        * clear buffer on map
        * @memberOf widgets/locator/locatorHelper
        */
        _clearBuffer: function () {
            var layer, graphic, i, count;
            layer = this.map.getLayer("tempBufferLayer");
            if (layer) {
                count = layer.graphics.length;
                for (i = 0; i < count; i++) {
                    graphic = layer.graphics[i];
                    if (graphic.geometry.type === "polygon") {
                        layer.remove(graphic);
                    }
                }
            }
        },

        /**
        * query layer to fetch the features
        * @param {object} geometry Contains geometry service of buffer
        * @param {map point}
        * @memberOf widgets/locator/locatorHelper
        */
        _queryLayer: function (geometry, mapPoint, fId) {
            var queryTask, queryLayer, featureSet, features;
            queryTask = new esri.tasks.QueryTask(dojo.configData.OperationalLayers[0].ServiceURL);
            queryLayer = new esri.tasks.Query();
            queryLayer.outFields = ["*"];
            queryLayer.returnGeometry = true;
            if (!fId) {
                if (geometry) {
                    queryLayer.geometry = geometry;
                }
            } else {
                queryLayer.where = "OBJECTID=" + parseInt(fId, 10);
            }
            queryTask.execute(queryLayer, lang.hitch(this, function (relatedRecords) {
                if (relatedRecords.features.length !== 0) {
                    var i;
                    featureSet = new esri.tasks.FeatureSet();
                    features = [];
                    for (i in relatedRecords.features) {
                        if (relatedRecords.features.hasOwnProperty(i)) {
                            features.push(relatedRecords.features[i]);
                        }
                    }
                    featureSet.features = features;
                    this._executeQueryForFeatures(featureSet, geometry, mapPoint);
                } else {
                    if (!fId) {
                        topic.publish("ShowHideResult", false);
                        alert(sharedNls.errorMessages.facilitydoestfound);
                        topic.publish("hideProgressIndicator");
                    }
                }
            }));
        },

        /**
        * get the feature within buffer and sort it in ascending order.
        * @param {object} featureset Contains information of feature within buffer
        * @param {object} geometry Contains geometry service of route
        * @param {mapPoint} map point
        * @memberOf widgets/locator/locatorHelper
        */
        _executeQueryForFeatures: function (featureset, geometry, mapPoint) {
            var featureSet = [], i, j, dist;
            for (i = 0; i < featureset.features.length; i++) {
                for (j in featureset.features[i].attributes) {
                    if (featureset.features[i].attributes.hasOwnProperty(j)) {
                        if (!featureset.features[i].attributes[j]) {
                            featureset.features[i].attributes[j] = "NA";
                        }
                    }
                }
                if (mapPoint.geometry) {
                    dist = this._getDistance(mapPoint.geometry, featureset.features[i].geometry);
                } else {
                    dist = this._getDistance(mapPoint, featureset.features[i].geometry);
                }
                try {

                    featureSet[i] = featureset.features[i];
                    featureSet[i].distance = dist.toString();
                } catch (err) {
                    alert(sharedNls.errorMessages.falseConfigParams);
                }
            }
            if (dist) {
                featureSet.sort(function (a, b) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                });
            }
            this._displayRouteOfNearestFeature(featureset, featureSet[0], units, mapPoint, 0, true);
        },

        /**
        * create route within buffer geometry
        * @param {object} features Contains features info within the buffer
        * @param {object} RouteParameters Contains Route parameter
        * @param {object} featureSet having the result of nearest feature
        * @param {object} SpatialReference Contains spatial reference of map
        * @param {object} units use for measurement unit of route
        * @param {mapPoint} map point
        * @memberOf widgets/locator/locatorHelper
        */
        _displayRouteOfNearestFeature: function (features, featureSet, units, mapPoint, featureIndex, isPodOpen) {
            var routeTask, routeParams, geoLocationPushpin, locatorMarkupSymbol, graphics;
            graphics = this._checkCurrentPosition();
            routeParams = new RouteParameters();
            routeParams.stops = new FeatureSet();
            routeParams.returnRoutes = true;
            routeParams.returnDirections = true;
            routeParams.directionsLengthUnits = units.MILES;
            routeParams.outSpatialReference = new SpatialReference({ wkid: 102100 });
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            if (mapPoint && mapPoint.geometry) {
                graphics = new esri.Graphic(mapPoint.geometry, locatorMarkupSymbol, {}, null);
            } else if (!isPodOpen && mapPoint) {
                graphics = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
            }

            /* if graphics is not found then add geoloaction point*/
            if (!graphics) {
                this._geolocation._showCurrentLocation().then(lang.hitch(this, function (mapPoint) {
                    routeParams.stops.features.push(mapPoint);
                    routeParams.stops.features.push(featureSet);
                    routeTask = new RouteTask(dojo.configData.RouteServiceURL);
                    this._clearRoute();
                    if (mapPoint) {
                        routeTask.solve(routeParams).then(lang.hitch(this, function (result) {
                            if (featureSet && features === null) {
                                this._showRoute(result, featureSet, mapPoint, featureIndex, isPodOpen);
                            } else {
                                this._showRoute(result, features, mapPoint, featureIndex, isPodOpen);
                            }
                        }), lang.hitch(this, function (error) {
                            this._createDirectionPodForActivitySearch(features, featureSet, mapPoint, featureIndex);
                        }), lang.hitch(this, function (error) {
                            this._createDirectionPodForActivitySearch(features, featureSet, mapPoint, featureIndex);
                        }));
                    } else {
                        this._createDirectionPodForActivitySearch(features, featureSet, mapPoint, featureIndex);
                    }
                }));
            } else {
                routeParams.stops.features.push(graphics);
                routeParams.stops.features.push(featureSet);
                routeTask = new RouteTask(dojo.configData.RouteServiceURL);
                this._clearRoute();
                routeTask.solve(routeParams).then(lang.hitch(this, function (result) {
                    if (featureSet && features === null) {
                        this._showRoute(result, featureSet, mapPoint, featureIndex, isPodOpen);
                    } else {
                        this._showRoute(result, features, mapPoint, featureIndex, isPodOpen);
                    }
                }), lang.hitch(this, function (error) {
                    this._createDirectionPodForActivitySearch(features, featureSet, mapPoint, featureIndex);
                }), lang.hitch(this, function (error) {
                    this._createDirectionPodForActivitySearch(features, featureSet, mapPoint, featureIndex);
                }));
            }
        },

        /**
        * highlight the feature and show direction pod in activity search case
        * @param {object} features Contains features info within the buffer
        * @param {object} featureSet having the result of nearest feature
        * @param {mapPoint} map point
        * @param {number} featureIndex is the index of feature
        * @memberOf widgets/locator/locatorHelper
        */
        _createDirectionPodForActivitySearch: function (features, featureSet, mapPoint, featureIndex) {
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            this._queryCommentLayer(features.features, null, features, null, mapPoint);
            this.activitySearchFeature = features.features[featureIndex];
            topic.publish("highlightFeature", features, featureIndex);
            this.map.setLevel(dojo.configData.ZoomLevel);
            this.map.centerAt(features.features[featureIndex].geometry);
            if (mapPoint) {
                alert(sharedNls.errorMessages.routeComment);
            }
            topic.subscribe("getDirectionForCarouselPod", lang.hitch(this, function (result) {
                this._getDirectionForCarouselPod(result, featureSet);
            }));
        },

        /**
        * check the graphic point is from geolocation or address search
        * @memberOf widgets/locator/locatorHelper
        */
        _checkCurrentPosition: function () {
            var geoLocationGraphic, glayer;
            glayer = this.map.getLayer("esriGraphicsLayerMapSettings").graphics;
            if (glayer.length > 0) {
                if (!(glayer[0].attributes && glayer[0].attributes.address)) {
                    geoLocationGraphic = glayer[0];
                }
            }
            return geoLocationGraphic;
        },

        /**
        * show route of nearest feature within buffer geometry
        * @param {object} solveResult Contains information of route
        * @param {object} features Contains the feature information within buffer
        * @param {mapPoint} map point
        * @memberOf widgets/locator/locatorHelper
        */
        _showRoute: function (solveResult, features, mapPoint, featureIndex, isPodOpen) {
            var directions, symbols, routeGraphic, address, featureArray, showDisatnceInfowindow, divDirectionContainer, distanceAndDuration, divDrectionContent, divDrectionList, i;
            directions = solveResult.routeResults[0].directions;
            symbols = new SimpleLineSymbol().setColor(dojo.configData.RouteColor).setWidth(dojo.configData.RouteWidth);
            routeGraphic = new esri.Graphic(directions.mergedGeometry, symbols, null, null);
            this.map.getLayer("routeLayerId").add(routeGraphic);
            this.map.getLayer("routeLayerId").show();
            if (features && features.length) {
                features.features.sort(function (a, b) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                });
                featureArray = features;
            } else if (features.features) {
                features.features.sort(function (a, b) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                });
                featureArray = features;
            } else {
                featureArray = {};
                featureArray.features = [];
                featureArray.features.push(features);
                featureIndex = 0;
            }
            this.activitySearchFeature = featureArray[featureIndex];
            if (mapPoint && mapPoint.attributes && mapPoint.attributes.address) {
                address = mapPoint.attributes.address;
            } else if (mapPoint) {
                address = sharedNls.titles.directionCurrentLocationText;
            }
            if (this.featureLayerClick && !isPodOpen) {
                showDisatnceInfowindow = query(".esriCTDirectionMainContainer")[0];
                domClass.replace(showDisatnceInfowindow, "esriCTDirectionMainContainerDisplayNone", "esriCTDirectionMainContainer");
                divDirectionContainer = domConstruct.create("div", { "class": "esriCTResultContentInfoWindow" }, dojo.byId("getDirContainer"));
                distanceAndDuration = domConstruct.create("div", { "class": "esriCTDistanceAndDuration" }, divDirectionContainer);
                domConstruct.create("div", { "class": "esriCTDivDistance", "innerHTML": sharedNls.titles.directionTextDistance + parseFloat(solveResult.routeResults[0].directions.totalLength).toFixed(2) + "mi" }, distanceAndDuration);
                domConstruct.create("div", { "class": "esriCTDivTime", "innerHTML": sharedNls.titles.directionTextTime + parseFloat(solveResult.routeResults[0].directions.totalDriveTime).toFixed(2) + "min" }, distanceAndDuration);
                divDrectionContent = domConstruct.create("div", { "class": "esriCTDirectionRow" }, divDirectionContainer);
                divDrectionList = domConstruct.create("ol", {}, divDrectionContent);
                domConstruct.create("li", { "class": "esriCTInfotextDirection", "innerHTML": solveResult.routeResults[0].directions.features[0].attributes.text.replace('Location 1', address) }, divDrectionList);
                for (i = 1; i < solveResult.routeResults[0].directions.features.length; i++) {
                    domConstruct.create("li", { "class": "esriCTInfotextDirection", "innerHTML": solveResult.routeResults[0].directions.features[i].attributes.text + "(" + parseFloat(solveResult.routeResults[0].directions.features[i].attributes.length).toFixed(2) + "miles" + ")" }, divDrectionList);
                }
                topic.publish("hideProgressIndicator");
            }
            if (isPodOpen) {
                topic.publish("highlightFeature", featureArray, featureIndex);
                this._queryCommentLayer(featureArray.features, solveResult.routeResults, featureArray, address, mapPoint);
            }
        },

        /**
        * calculate the distance between the puspin(start point) and nearest feature(end point)
        * @param {object} startPoint is pushpin on map
        * @param {object} endPoint is search result
        * @memberOf widgets/locator/locatorHelper
        */
        _getDistance: function (startPoint, endPoint) {
            var sPoint, ePoint, lon1, lat1, lon2, lat2, theta, dist;
            sPoint = esri.geometry.webMercatorToGeographic(startPoint);
            ePoint = esri.geometry.webMercatorToGeographic(endPoint);
            lon1 = sPoint.x;
            lat1 = sPoint.y;
            lon2 = ePoint.x;
            lat2 = ePoint.y;
            theta = lon1 - lon2;
            dist = Math.sin(this._deg2Rad(lat1)) * Math.sin(this._deg2Rad(lat2)) + Math.cos(this._deg2Rad(lat1)) * Math.cos(this._deg2Rad(lat2)) * Math.cos(this._deg2Rad(theta));
            dist = Math.acos(dist);
            dist = this._rad2Deg(dist);
            dist = dist * 60 * 1.1515;
            return (dist * 10) / 10;
        },

        /**
        * Convert the  degrees  to radians
        * @param {object} deg is degree which converts to radians
        * @return radians value
        * @memberOf widgets/locator/locatorHelper
        */
        _deg2Rad: function (deg) {
            return (deg * Math.PI) / 180.0;
        },

        /**
        * Convert the radians to degrees
        * @param {object} rad is radians which converts to degree
        * @return degree value
        * @memberOf widgets/locator/locatorHelper
        */
        _rad2Deg: function (rad) {
            return (rad / Math.PI) * 180.0;
        },

        /**
        * clear the route graphic on the map
        * @memberOf widgets/locator/locatorHelper
        */
        _clearRoute: function () {
            this.map.getLayer("routeLayerId").clear();
        },

        /**
        * query on Comment Layer
        * @param {object} features Contains the feature information within buffer
        * @param {object} solveResult Contains information of route
        * @param {array} featuresResult Contain sort array of feature
        * @param {object} address Contain the search address
        * @param {mapPoint} map point
        * @memberOf widgets/locator/locatorHelper
        */
        _queryCommentLayer: function (feature, solveResult, featuresResult, address, mapPoint, divComentContainer) {
            var queryTask, featureId, esriQuery, i, deferredArray = [], featuresData, deferredListResult, commentArray, j, k;
            queryTask = new esri.tasks.QueryTask(dojo.configData.CommentsLayer.URL);
            esriQuery = new esri.tasks.Query();
            esriQuery.outFields = ["*"];
            esriQuery.returnGeometry = true;
            if (feature) {
                featureId = feature[0].attributes.OBJECTID;
                for (i = 0; i < feature.length; i++) {
                    esriQuery.where = "ID=" + feature[i].attributes.OBJECTID;
                    deferredArray.push(queryTask.execute(esriQuery, lang.hitch(this, this._executeQueryTask)));
                }
            } else {
                featureId = featuresResult.OBJECTID;

                esriQuery.where = "ID=" + featuresResult.OBJECTID;
                deferredArray.push(queryTask.execute(esriQuery, lang.hitch(this, this._executeQueryTask)));
            }
            deferredListResult = new DeferredList(deferredArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                commentArray = [];
                if (result.length > 0) {
                    for (j = 0; j < result.length; j++) {
                        if (result[j][0] && result[j][1].features) {
                            featuresData = result[0][1].features;
                            for (k = 0; k < result[j][1].features.length; k++) {
                                commentArray.push(result[j][1].features[k]);
                            }
                        }
                    }
                    if (feature) {
                        topic.publish("setSearchInfo", { "directionResult": solveResult, "searchResult": featuresResult, "addressResult": address, "mapPoint": mapPoint, "CommentResult": commentArray }, this.searchFacility);
                        topic.publish("setFacilityCarouselPod", { "directionResult": solveResult, "searchResult": featuresResult, "addressResult": address, "mapPoint": mapPoint });
                        topic.publish("getFeatures", featuresData);
                        topic.publish("ShowHideResult", true);
                    } else {
                        commentArray.sort(function (a, b) {
                            return b.attributes.OBJECTID - a.attributes.OBJECTID;
                        });
                        this._setCommentForInfoWindow(commentArray, divComentContainer, featureId);
                    }
                }
            }));
        },

        /**
        * set the content in (Comments) infoWindow
        * @param {object} result contains route result, features in buffer area, search address,mapPoint, comment layer info
        * @param {node} divComentContainer is domNode
        * @memberOf widgets/locator/locatorHelper
        */
        _setCommentForInfoWindow: function (result, divComentContainer, featureId) {
            var j, divHeaderStar, divStar, utcMilliseconds, l, isCommentFound = false, rankFieldAttribute, commentAttribute, divCommentRow, esriCTCommentDateStar, postCommentButton, infocontainer, postCommentContainer;
            try {
                rankFieldAttribute = dojo.configData.DatabaseFields.RankFieldName;
                commentAttribute = dojo.configData.DatabaseFields.CommentsFieldName;
                if (result.length > 0) {
                    for (l = 0; l < result.length; l++) {
                        divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, this.divContentDiv);
                        esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);
                        for (j = 0; j < 5; j++) {
                            divStar = domConstruct.create("span", { "class": "esriCTRatingStar" }, divHeaderStar);
                            if (j < result[l].attributes[rankFieldAttribute]) {
                                domClass.add(divStar, "esriCTRatingStarChecked");
                            }
                        }
                        if (result[l].attributes[commentAttribute]) {
                            isCommentFound = true;
                            if (result[l].attributes.SUBMITDT === null) {
                                utcMilliseconds = 0;
                            } else {
                                utcMilliseconds = Number(dojo.string.substitute(dojo.configData.CommentsInfoPopupFieldsCollection.SubmitDate, result[l].attributes));
                            }
                            domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": result[l].attributes[commentAttribute] }, divCommentRow);
                            domConstruct.create("div", { "class": "esriCTCommentDateInfowindo", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), { datePattern: dojo.configData.DateFormat, selector: "date" }) }, esriCTCommentDateStar);
                        } else {
                            domConstruct.empty(this.divContentDiv);
                            domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, this.divContentDiv);
                        }
                    }
                }
                if (!isCommentFound) {
                    domConstruct.empty(this.divContentDiv);
                    domConstruct.create("div", { "class": "esriCTNullCommentText", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, this.divContentDiv);
                }
                domClass.add(divComentContainer, "esriCTInfoContentComment");
                postCommentContainer = domConstruct.create("div", { "class": "esriCTButtonDiv" }, null);
                postCommentButton = domConstruct.create("div", { "class": "esriCTInfoPostButton", "innerHTML": sharedNls.titles.postComment }, postCommentContainer);
                infocontainer = query('.esriCTCommentContainer')[0];
                domConstruct.place(postCommentContainer, infocontainer, "after");
                this.own(on(postCommentButton, "click", lang.hitch(this, function () {
                    this._postComment(featureId, result);
                })));
            } catch (error) {
                alert(error);
            }
        },

        /**
        * set the content in infoWindow for post comment
        * @memberOf widgets/locator/locatorHelper
        */
        _postComment: function (commentID, result) {
            var divStarRating, postCommentContainer, buttonDiv, backButton, submitButton, j, starInfoWindow = [], backToMapHide, postCommentContent;
            backToMapHide = query('.cloasedivmobile')[0];
            domStyle.set(backToMapHide, "display", "none");
            domStyle.set(this.OuterCommentContainer, "display", "none");
            if (dojo.byId("divCTPostCommentContainer")) {
                domConstruct.destroy(dojo.byId("divCTPostCommentContainer"));
            }
            postCommentContainer = domConstruct.create("div", { "id": "divCTPostCommentContainer" }, dojo.byId("commentsTabContainer"));
            postCommentContent = domConstruct.create("div", { "class": "esriCTPostCommentContainer" }, postCommentContainer);
            domConstruct.create("div", { "class": "esriCTheadText", "innerHTML": sharedNls.titles.rating }, postCommentContent);
            divStarRating = domConstruct.create("div", { "class": "esriCTStarPostComment" }, postCommentContent);
            for (j = 0; j < 5; j++) {
                this.rankValue = 0;
                this._checked = false;
                starInfoWindow[j] = domConstruct.create("div", { "class": "esriCTRatingStarPostComment" }, divStarRating);
                this.own(on(starInfoWindow[j], "click", lang.hitch(this, this._selectedStarForPostComment, starInfoWindow, starInfoWindow[j], j)));
                this.own(on(starInfoWindow[j], "mouseover", lang.hitch(this, this._selectHoverStars, starInfoWindow, starInfoWindow[j], j)));
                this.own(on(starInfoWindow[j], "mouseout", lang.hitch(this, this._deSelectHoverStars, starInfoWindow, starInfoWindow[j], j)));
            }
            domConstruct.create("textarea", { "class": "textAreaContainer", "id": "txtComments", "placeholder": sharedNls.titles.postCommentText }, postCommentContent);
            buttonDiv = domConstruct.create("div", { "class": "esriCTButtonDiv" }, postCommentContainer);
            backButton = domConstruct.create("div", { "class": "esriCTInfoBackButton", "innerHTML": sharedNls.titles.backButton }, buttonDiv);
            submitButton = domConstruct.create("div", { "class": "esriCTInfoSubmitButton", "innerHTML": sharedNls.titles.submitButton }, buttonDiv);
            this.own(on(backButton, "click", lang.hitch(this, function () {
                this._backButton(buttonDiv);
            })));
            this.own(on(submitButton, "click", lang.hitch(this, function () {
                this._submitButton(commentID, result);
            })));
        },

        /**
        * selectedStarForPostComment in infoWindow for post comment block
        * @memberOf widgets/locator/locatorHelper
        */
        _selectedStarForPostComment: function (result, starInfoWindow, j) {
            var i;
            if ((result[j].classList.contains("esriCTRatingStarChecked")) && this._checked) {
                for (i = 4; i >= j; i--) {
                    domClass.replace(result[i], "esriCTRatingStar");
                }
                if (j !== 0) {
                    domClass.add(result[j], "esriCTRatingStarChecked");
                }
            } else {
                for (i = 0; i <= j; i++) {
                    domClass.add(result[i], "esriCTRatingStarChecked");
                    this._checked = true;
                }
            }
            this.checkedStars = query('.esriCTRatingStarChecked');
            this.rankValue = j + 1;
        },

        _selectHoverStars: function (result, starinfowindow, j) {
            var i;
            for (i = 0; i <= j; i++) {
                if (result[i].classList.contains("esriCTRatingStar") || result[i].classList.contains("esriCTRatingStarPostComment")) {
                    domClass.add(result[i], "esriCTRatingStarHover");
                }
            }
        },

        _deSelectHoverStars: function (result, starinfowindow, j) {
            var i;
            for (i = 0; i <= j; i++) {
                if (result[i].classList.contains("esriCTRatingStarHover")) {
                    domClass.remove(result[i], "esriCTRatingStarHover");
                }
            }
        },




        /**
        * backButton in infoWindow for post comment block
        * @memberOf widgets/locator/locatorHelper
        */
        _backButton: function (postCommentContainer) {
            var backToMapHide;
            backToMapHide = query('.cloasedivmobile')[0];
            domStyle.set(backToMapHide, "display", "block");
            domStyle.set(dojo.byId("divCTPostCommentContainer"), "display", "none");
            domStyle.set(this.OuterCommentContainer, "display", "block");
        },


        /**
        * submit button in infoWindow for post comment
        * @memberOf widgets/locator/locatorHelper
        */
        _submitButton: function (selectedFeatureID, result) {
            var commentsLayer, commentGraphic, currenDate, currentDateFormat, attr, self, setAttribute, updatedComments, i, k, currentMonth, divCommentRow,
                destroyCommentText, esriCTCommentDateStar, divHeaderStar, divStar;
            self = this;
            topic.publish("showProgressIndicator");
            if (dojo.byId("txtComments").value.trim().length === 0 && self.rankValue === 0) {
                domStyle.set(self.OuterCommentContainer, "display", "none");
                alert(sharedNls.errorMessages.commentString);
                topic.publish("hideProgressIndicator");
            } else if (dojo.byId("txtComments").value.trim().length === 0) {
                dojo.byId("txtComments").focus();
                alert(sharedNls.errorMessages.commentString);
                topic.publish("hideProgressIndicator");

            } else if (dojo.byId("txtComments").value.length > 250) {
                dojo.byId("txtComments").focus();
                alert(sharedNls.errorMessages.maxLenghtCommentstring);
                topic.publish("hideProgressIndicator");
            } else {
                commentsLayer = new esri.layers.FeatureLayer(dojo.configData.CommentsLayer.URL, {
                    mode: esri.layers.FeatureLayer.MODE_SELECTION,
                    outFields: ["*"]
                });
                commentGraphic = new esri.Graphic();
                currenDate = new Date();
                currentMonth = currenDate.getMonth();
                currentMonth = currentMonth + 1;
                currentDateFormat = currentMonth + " " + currenDate.getDate() + ", " + currenDate.getFullYear();
                attr = {};

                attr[dojo.configData.DatabaseFields.FeatureIdFieldName] = selectedFeatureID;
                attr[dojo.configData.DatabaseFields.CommentsFieldName] = dojo.byId("txtComments").value.trim();
                attr[dojo.configData.DatabaseFields.DateFieldName] = currentDateFormat; // date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow()));
                attr[dojo.configData.DatabaseFields.RankFieldName] = this.rankValue;

                setAttribute = {
                    COMMENTS: dojo.byId("txtComments").value.trim(),
                    SUBMITDT: currentDateFormat,
                    RANK: self.rankValue
                };
                commentGraphic.setAttributes(attr);
                updatedComments = [];
                commentsLayer.applyEdits([commentGraphic], null, null, lang.hitch(this, function (msg) {
                    if (!msg[0].error) {
                        updatedComments.push({ "attributes": setAttribute });
                        for (i = 0; i < result.length; i++) {
                            updatedComments.push(result[i]);
                        }
                        domStyle.set(dojo.byId("divCTPostCommentContainer"), "display", "none");
                        domStyle.set(self.OuterCommentContainer, "display", "block");
                        destroyCommentText = query('.esriCTNullCommentText')[0];
                        if (destroyCommentText) {
                            domConstruct.destroy(destroyCommentText);
                        }
                        divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, null);
                        esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);

                        for (k = 0; k < 5; k++) {
                            divStar = domConstruct.create("span", { "class": "esriCTRatingStar" }, divHeaderStar);
                            if (k < setAttribute.RANK) {
                                domClass.add(divStar, "esriCTRatingStarChecked");
                            }
                        }
                        domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": setAttribute.COMMENTS }, divCommentRow);
                        domConstruct.create("div", { "class": "esriCTCommentDateInfowindo", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(currenDate.getTime()), { datePattern: dojo.configData.DateFormat, selector: "date" }) }, esriCTCommentDateStar);
                        this.divContentDiv.insertBefore(divCommentRow, this.divContentDiv.children[0]);
                        topic.publish("hideProgressIndicator");
                    }

                }), function (err) {
                    topic.publish("hideProgressIndicator");
                    alert(sharedNls.errorMessages.commentError);
                });
            }
        },

        /**
        * scrollbar for comment in infoWindow
        * @memberOf widgets/locator/locatorHelper
        */
        _setCommentScrollbar: function () {
            var esriCTDivContentComment = query('.esriCTDivContentComment')[0];
            this.commentInfoWindoScrollBar = new ScrollBar({ domNode: esriCTDivContentComment });
            this.commentInfoWindoScrollBar.setContent(this.divContentDiv);
            this.commentInfoWindoScrollBar.createScrollBar();
            while (this.commentInfoWindoScrollBar.domNode.childElementCount > 1) {
                this.commentInfoWindoScrollBar.domNode.removeChild(this.commentInfoWindoScrollBar.domNode.firstChild);
            }
        },
        /**
        * execute query task for Comment Layer
        * @param {object} relatedRecords Contains Comment layer URL
        * @memberOf widgets/locator/locatorHelper
        */
        _executeQueryTask: function (relatedRecords) {
            var featureSet, i, deferred, features = [];
            deferred = new Deferred();
            featureSet = new esri.tasks.FeatureSet();
            if (relatedRecords.features.length > 0) {
                for (i = 0; i < relatedRecords.features.length; i++) {
                    if (relatedRecords.features.hasOwnProperty(i)) {
                        features.push(relatedRecords.features[i]);
                    }
                }
                featureSet.features = features;
            }
            deferred.resolve(relatedRecords);
        },

        /**
        * create activity search panel
        * @memberOf widgets/locator/locatorHelper
        */
        _showActivitySearchContainer: function () {
            var activitySearchMainContainer, activitySearchContent = [], activityTickMark, activityImageDiv, i, activitySearchMainContent, activitySearchGoButton;
            activitySearchMainContainer = domConstruct.create("div", { "class": "esriCTActivityMainContainer" }, this.esriCTActivityContainer);
            activitySearchMainContent = domConstruct.create("div", { "class": "esriCTActivityTable" }, activitySearchMainContainer);
            for (i = 0; i < dojo.configData.Activities.length; i++) {
                activitySearchContent[i] = domConstruct.create("div", { "class": "esriCTActivityRow", "index": i }, activitySearchMainContent);
                activityImageDiv = domConstruct.create("div", { "class": "esriCTActivityImage" }, activitySearchContent[i]);
                domConstruct.create("img", { "src": dojo.configData.Activities[i].Image }, activityImageDiv);
                activityTickMark = domConstruct.create("div", { "class": "esriCTActivityTextArea" }, activitySearchContent[i]);
                this.own(on(activitySearchContent[i], "click", lang.hitch(this, this._selectActivity, activityTickMark)));
                if (dojo.configData.Activities[i].IsSelected) {
                    domClass.add(activityTickMark, "esriCTTickMark");
                } else {
                    domClass.remove(activityTickMark, "esriCTTickMark");
                }
                domConstruct.create("div", { "class": "esriCTActivityText", "innerHTML": dojo.configData.Activities[i].Alias }, activityTickMark);
            }
            activitySearchGoButton = domConstruct.create("div", { "class": "esriCTActivitySerachGoButton", "innerHTML": "GO" }, this.esriCTActivityContainer);
            this.own(on(activitySearchGoButton, "click", lang.hitch(this, this._selectActivitySearchGoButton)));
            domClass.add(activitySearchMainContainer, "esriCTActivityContentHeight");
            this.activitySearchScrollBar = new ScrollBar({ domNode: activitySearchMainContainer });
            this.activitySearchScrollBar.setContent(activitySearchMainContent);
            this.activitySearchScrollBar.createScrollBar();
        },

        /**
        * set the select and unselect in activity serach.
        * param {object} activityTickMark is domNode
        * @memberOf widgets/locator/locatorHelper
        */
        _selectActivity: function (activityTickMark) {
            if (domClass.contains(activityTickMark, "esriCTTickMark")) {
                domClass.remove(activityTickMark, "esriCTTickMark");
            } else {
                domClass.add(activityTickMark, "esriCTTickMark");
            }
        },

        /**
        * on click of facility show and hide the tick mark
        * @memberOf widgets/locator/locatorHelper
        */
        _selectActivitySearchGoButton: function () {
            var activityArray = [], infoActivity, temp, selectedRow, j, i, selectedFeatureText;
            this.featureLayerClick = null;
            this._removeGraphics();
            domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
            domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            topic.publish("showProgressIndicator");
            this.searchFacility = true;
            infoActivity = dojo.configData.Activities;
            for (i = 0; i < infoActivity.length; i++) {
                temp = infoActivity[i];
                temp.AttributeName = infoActivity[i];
                activityArray.push(infoActivity[i]);
            }
            if (infoActivity) {
                selectedRow = query('.esriCTTickMark');
                if (selectedRow) {
                    for (j = 0; j < selectedRow.length; j++) {
                        selectedFeatureText = dojo.query(selectedRow[j]).text();
                        for (i = 0; i < infoActivity.length; i++) {
                            if (selectedFeatureText === infoActivity[i].Alias) {
                                domAttr.set(selectedRow[j], "activity", infoActivity[i].FieldName);
                                domAttr.set(selectedRow[j], "index", i);
                            }
                        }
                    }
                    this._showActivityResult(selectedRow);
                } else {
                    alert(sharedNls.errorMessages.activityNotSelected);
                }
            }
        },

        /**
        * query the feature layer for activity search
        * @param{object}selectedRow contains the selected feature
        * @memberOf widgets/locator/locatorHelper
        */
        _showActivityResult: function (selectedRow) {
            var activityQueryString, mapPoint, facilityLayer, queryTask, queryForActivity, i, objectIds, selectedFeature, j, activity;
            topic.publish("infowindowInstance");
            activityQueryString = "";
            for (i = 0; i < selectedRow.length; i++) {
                activity = domAttr.get(selectedRow[i], "activity");
                activityQueryString += activity + " = 'Yes' AND ";
            }
            if (activityQueryString === "") {
                alert(sharedNls.errorMessages.activityNotSelected);
                topic.publish("hideProgressIndicator");
                return;
            }
            facilityLayer = dojo.configData.OperationalLayers[0].ServiceURL;
            activityQueryString += "1=1";
            queryTask = new esri.tasks.QueryTask(facilityLayer);
            queryForActivity = new esri.tasks.Query();
            queryForActivity.where = activityQueryString;
            queryForActivity.outFields = ["*"];
            queryForActivity.returnGeometry = true;
            queryTask.execute(queryForActivity, lang.hitch(this, function (relatedRecords) {
                objectIds = relatedRecords.features;
                if (objectIds.length === 1) {
                    if (objectIds.length > 0) {
                        if (objectIds.length === 1) {
                            selectedFeature = relatedRecords.features[0].geometry;
                        }
                        mapPoint = this._getMapPoint(selectedFeature);
                        if (relatedRecords.features[0]) {
                            this._executeQueryForFeatures(relatedRecords, selectedFeature, mapPoint);
                        } else {
                            alert(sharedNls.errorMessages.invalidSearch);
                            topic.publish("hideProgressIndicator");
                        }
                    }
                } else {
                    try {
                        for (j = 0; j < objectIds.length; j++) {
                            mapPoint = this._getMapPoint(relatedRecords.features[j].geometry);
                        }
                    } catch (err) {
                        topic.publish("hideProgressIndicator");
                    }
                    if (relatedRecords.features[0]) {
                        this._executeQueryForFeatures(relatedRecords, selectedFeature, mapPoint);
                    } else {
                        alert(sharedNls.errorMessages.invalidSearch);
                        topic.publish("hideProgressIndicator");
                    }
                }
            }));
        },

        /**
        * UI for direction when its from activity search
        * @param {object} result contains route result, features in buffer area, search address,mapPoint, comment layer info
        * @param {object} featureSet contains  the features.
        * @memberOf widgets/locator/locatorHelper
        */
        _getDirectionForCarouselPod: function (result, featureSet) {
            var directionContainer, directionContent, divActivityHeader, divActivitySearchText, divActivityAddressText, divActivitySearchClose, spanActivityClose, innerActivitySpan, imageActivitySearchLoader,
                divActivitySearchInfo, divActivityAddressListInfo, divActivityAddressScrollContainerInfo, directionSearchContainer, divActivityAddressScrollContentInfo, divActivityAddressResult, activityLocatorParams;
            directionContainer = query('.esriCTDivDirectioncontent');
            if (directionContainer) {
                domConstruct.empty(directionContainer[0]);
            }
            directionContent = domConstruct.create("div", { "class": "esriCTDirectionContentForCarousel" }, directionContainer[0]);
            divActivityHeader = domConstruct.create("div", { "class": "esriCTDivActivityHeadercontainerInfo" }, directionContent);
            this._directionHeaderContainer = domConstruct.create("div", { "class": "esriCTActivityHeadText" }, divActivityHeader);
            this._setStartPoint(result.searchResult.features[0].attributes.NAME);
            directionSearchContainer = domConstruct.create("div", { "class": "esriCTdirectionSearchContainer" }, directionContent);
            divActivitySearchText = domConstruct.create("div", { "class": "esriCTsearchTextInner" }, directionSearchContainer);
            divActivityAddressText = domConstruct.create("input", { "class": "esriCTTxtAddress", "type": "text" }, divActivitySearchText);
            divActivitySearchClose = domConstruct.create("div", { "class": "esriCTSearchClose" }, directionSearchContainer);
            spanActivityClose = domConstruct.create("span", { "class": "esriCTClearInput", "title": sharedNls.tooltips.clearEntry }, divActivitySearchClose);
            innerActivitySpan = domConstruct.create("span", {}, divActivitySearchClose);
            imageActivitySearchLoader = domConstruct.create("image", { "class": "esriCTSearchLoader" }, innerActivitySpan);
            domAttr.set(imageActivitySearchLoader, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            divActivitySearchInfo = domConstruct.create("div", { "class": "esriCTSearch" }, directionContent);
            domConstruct.create("span", { "class": "esriCTSearchIcon", "title": sharedNls.tooltips.search }, divActivitySearchInfo);
            divActivityAddressListInfo = domConstruct.create("div", { "class": "esriCTAddressListInfoWindow" }, directionContent);
            divActivityAddressScrollContainerInfo = domConstruct.create("div", { "class": "esriCTAddressScrollContainer" }, divActivityAddressListInfo);
            divActivityAddressScrollContentInfo = domConstruct.create("div", { "class": "esriCTDirectionScrollContent" }, divActivityAddressScrollContainerInfo);
            divActivityAddressResult = domConstruct.create("div", { "class": "esriCTFullWidth" }, divActivityAddressScrollContentInfo);
            this._setDefaultTextboxValue(divActivityAddressText);
            divActivityAddressText.value = domAttr.get(divActivityAddressText, "defaultAddress");
            activityLocatorParams = {
                divSearch: divActivitySearchInfo,
                divAddressContent: null,
                imgSearchLoader: imageActivitySearchLoader,
                txtAddress: divActivityAddressText,
                close: spanActivityClose,
                divAddressResults: divActivityAddressResult,
                divAddressScrollContainer: divActivityAddressScrollContainerInfo,
                divAddressScrollContent: divActivityAddressScrollContentInfo,
                lastSearchString: this.lastSearchStringInfoWindow,
                locatorScrollBar: this.activityLocatorScrollbarInfoWindow,
                showBuffer: false
            };
            this._attachLocatorEvents(activityLocatorParams);
            this.activitySearchFeature = featureSet;
        },

        /**
        * set the header name of direction carousel pod for activity search
        * @param {String} name Header name for direction pod
        * @memberOf widgets/locator/locatorHelper
        */
        _setStartPoint: function (name) {
            if (this._directionHeaderContainer) {
                this._directionHeaderContainer.innerHTML = sharedNls.titles.directionText + " " + name;
            }
        },

        _removeGraphics: function () {
            var self = this;
            self._clearRoute();
            self.map.getLayer("highlightLayerId").clear();
            self.map.getLayer("esriGraphicsLayerMapSettings").clear();
        }
    });
});
