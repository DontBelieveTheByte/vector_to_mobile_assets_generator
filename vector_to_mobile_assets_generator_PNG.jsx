
var runtimeConfig = {
    pathInfo : {
        currentDocument : app.activeDocument.path,
        exportSubFolderName : "asset_dump"
    },
    layerMetaData : {
        exportLayersPrefix : "#",
        exportLayersWithArtBoardClippingPrefix : "$"
    },
    formats : {
        androidLdpi : {
            name : "ldpi",
            scale : 75,
            fileAppend : ""
        },
        androiddMdpi : {
            name : "mdpi",
            scale : 100,
            fileAppend : ""
        },
        androidHdpi : {
            name : "hdpi",
            scale : 150,
            fileAppend : ""
        },
        androidXhdpi : {
            name : "xhdpi",
            scale : 200,
            fileAppend : ""
        },
        androidXxhdpi : {
            name : "xxhdpi",
            scale : 300,
            fileAppend : ""
        },
        androidXxxhdpi : {
            name : "xxxhdpi",
            scale : 400,
            fileAppend : ""
        },
        iOSLow : {
            name : "low",
            scale : 400,
            fileAppend : "@Low"
        },
        iOSNormal : {
            name : "normal",
            scale : 400,
            fileAppend : ""
        },
        iOsHigh : {
            name : "high",
            scale : 400,
            fileAppend : "@High"
        }
    }
};

var utils = {
    report : {
        isCurrentDocumentSaved: function(){
            return ("" !== runtimeConfig.pathInfo.currentDocument);
        },
        printDocumentNotSaved : function(){
            alert("Aborted! Save your report before you can export.");
        },
        printLayerResults: function (layersExportedCount) {
            var reportTxt;
            if (layersExportedCount <= 0 || !layersExportedCount) {
                reportTxt = "No layer to export!\n Remember that you must add a \"";
                reportTxt += runtimeConfig.layerMetaData.exportLayersPrefix;
                reportTxt +="\"";
                reportTxt += " (when exporting the layer cropped to it's bound)";
                reportTxt += " or \"";
                reportTxt +=  runtimeConfig.layerMetaData.exportLayersWithArtBoardClippingPrefix;
                reportTxt += "\" (when layer should be clipped to artboard) to the beginning of the layer name. \nAlso make sure that they layers you want to export are not locked or hidden.";
            } else {
                reportTxt = layersExportedCount;
                reportTxt += (layersExportedCount > 1) ?
                    " layers were" :
                    " layer was";
                reportTxt += " successfully exported to: \n";
                reportTxt +=  runtimeConfig.pathInfo.exportSubFolderName;
            }
            alert(reportTxt);
        }
    },
    layer: {
        hideAll: function (extendedLayersArray) {
            for (var i = 0; i < extendedLayersArray.length; i++) {
                extendedLayersArray[i].hide();
            }
        },
        showAll: function (extendedLayersArray) {
            for (var i = 0; i < extendedLayersArray.length; i++) {
                extendedLayersArray[i].restoreVisibility();
            }
        },
        setTag : function (layerNamePrefix, layer){

            // Tag these layers so that we later can find out if we should export these layers or not
            if (layerNamePrefix === runtimeConfig.layerMetaData.exportLayersPrefix) {
                layer.tag = "include";
            } else if (layerNamePrefix == runtimeConfig.layerMetaData.exportLayersWithArtBoardClippingPrefix) {
                layer.tag = "include_and_clip";
            } else {
                layer.tag = "skip";
            }
        },
        getLayerArray: function (rootLayer, extendedRootLayer) {
            var extendedLayerDataArray = [];

            for (var i = 0; i < rootLayer.layers.length; i++) {

                // We never even process locked or hidden layers
                if ((!rootLayer.layers[i].locked) && (rootLayer.layers[i].visible)) {

                    var layer = new Layer(rootLayer.layers[i]);

                    // Set up parent
                    layer.parentLayer = extendedRootLayer;

                    // Also add this layer to the parents child collection
                    if (extendedRootLayer != null) {
                        extendedRootLayer.childLayers.push(layer);
                    }
                    extendedLayerDataArray.push(layer);
                    utils.layer.setTag(rootLayer.layers[i].name.substring(0, 1), layer);

                    // We should not export this layer but we continue looking for sub layers that might need to be exported
                    utils.layer.getLayerArray(rootLayer.layers[i], layer);
                }
            }
            return extendedLayerDataArray;
        },
        exportToAllScales : function(layer, clipToArtBoard){
            var exportFolderPath;
            var exportFileName;
            for (var format in runtimeConfig.formats) {
                exportFolderPath = utils.folder.computeExportFolderPath(runtimeConfig.formats[format].name);
                utils.folder.createExportFolderIfNotExists(exportFolderPath);
                exportFileName = exportFolderPath +  "/" + layer.getCleanName();
                exportFileName += runtimeConfig.formats[format].fileAppend;
                utils.fileWriters.PNG24bit(
                    exportFileName,
                    runtimeConfig.formats[format].scale,
                    clipToArtBoard
                );
            }
        }
    },
    folder: {
        computeExportFolderPath: function (folderPathSuffix) {
            var computedPath = runtimeConfig.pathInfo.currentDocument +"/" ;
            computedPath += runtimeConfig.pathInfo.exportSubFolderName + "/";
            computedPath += folderPathSuffix;
            return computedPath;
        },
        createRootExportFolder: function () {
            var exportFolderPath = runtimeConfig.pathInfo.currentDocument + "/" + runtimeConfig.pathInfo.exportSubFolderName;
            utils.folder.createExportFolderIfNotExists(exportFolderPath);
        },
        createExportFolderIfNotExists: function (folderPath) {
            var aFolder = new Folder(folderPath);
            if (!aFolder.exists) {
                aFolder = new Folder(folderPath);
                aFolder.create();
            }
        }
    },
    fileWriters : {
        PNG8bit : function(fileName, scale, artBoardClipping){
            var aFile = new File(fileName);
            var exportOptions = new ExportOptionsPNG8();
            exportOptions.transparency = true;
            exportOptions.horizontalScale = scale;
            exportOptions.verticalScale = scale;
            exportOptions.artBoardClipping = artBoardClipping;
            app.activeDocument.exportFile(aFile, ExportType.PNG8, exportOptions);
        },
        PNG24bit : function(fileName, scale, artBoardClipping){
            var exportOptions = new ExportOptionsPNG24();
            var aFile = new File(fileName);
            exportOptions.transparency = true;
            exportOptions.horizontalScale = scale;
            exportOptions.verticalScale = scale;
            exportOptions.artBoardClipping = artBoardClipping;
            app.activeDocument.exportFile(aFile, ExportType.PNG24, exportOptions);
        }
    }
};

function Layer(layer){

    this.name = layer.name;
    // Set after creating
    this.childLayers = [];
    this.parentLayer = null;
    this.layer = layer;
    this.tag = "";

    this.originalVisibility = layer.visible;

    this.getCleanName = function(){
        var regexStr = '^(';
        regexStr += runtimeConfig.layerMetaData.exportLayersPrefix;
        regexStr += '|';
        regexStr += runtimeConfig.layerMetaData.exportLayersWithArtBoardClippingPrefix;
        regexStr += ')';
        var regex = new RegExp(regexStr);
        return this.name.replace(regex,"");
    };

    this.hide = function(){
        layer.visible = false;
    };

    this.show = function(){
        layer.visible = true;
    };

    this.showIncludingParentAndChildLayers = function(){

        var parentlayerName = "";

        if (this.parentLayer != null) {
            parentlayerName = this.parentLayer.layerName;
        }

        // Show all parents first
        var aParentLayer = this.parentLayer;

        while (aParentLayer != null) {
            aParentLayer.restoreVisibility();

            // Keep looking
            aParentLayer = aParentLayer.parentLayer;
        }

        // Show our own layer finally
        this.restoreVisibilityIncludingChildLayers();
    };

    this.restoreVisibility = function restoreVisibility(){
        layer.visible = this.originalVisibility;
    };

    this.restoreVisibilityIncludingChildLayers = function(){
        this.restoreVisibility();
        // Call recursively for each child layer
        for (var i = 0; i < this.childLayers.length; i++) {
            this.childLayers[i].restoreVisibilityIncludingChildLayers();
        }
    };
}

    var layers;
    var layersExportedCount = 0;
    var clipToArtBoard;
    if (utils.report.isCurrentDocumentSaved()) {

        utils.folder.createRootExportFolder();
        layers = utils.layer.getLayerArray(app.activeDocument, null);

        for (var i = 0; i < layers.length; i++) {
            if (("include" === layers[i].tag) || ("include_and_clip" === layers[i].tag)) {
                utils.layer.hideAll(layers);
                clipToArtBoard = (layers[i].tag == "include_and_clip");
                layers[i].showIncludingParentAndChildLayers();
                //GOOD TILL HERE
                utils.layer.exportToAllScales(layers[i], clipToArtBoard);
                layersExportedCount++;
            }
        }
        utils.layer.showAll(layers);
        utils.report.printLayerResults(layersExportedCount);
    } else {
        utils.report.printDocumentNotSaved();
    }

