//Global variables:
var proj = app.project;
var compFolder = null;
var compNumber = 0;
var currentComp = null;
var footageTypeList =[];
var footageFolder = null;

//DEFAULTS:______________________________________________
//-------Project---------//
var compFolderName = "01-Sequencer Comps";
var defaultCompName = "sequence";
//----Image------//
var maxImageDuration = 4;
var minImageDuration = 0;
var imageDurationDefault = 1;
var maxImageRandomDuration = 2;
//----Video------//
var maxVideoDuration = 15;
var minVideoDuration = 0;
var videoDurationDefault = 3;
var maxVideoRandomDuration = 5;
//----Transition------//
var maxTranstionDuration = 1;
var minTranstionDuration = 0;
var videoTranstionDefault = 3;
//defaults___________________________________________________


//User Variables:
var imageDuration = {value: 0};
var imageRandomDuration = {value: 0};
var videoDuration = {value: 0};
var videoRandomDuration = {value: 0};
var transitionDuration = {value: 0};
var makeTransition = {value: false};
var simpleTransitionProperty = {value: "ADBE Opacity"};

var compAttrs = {
    name: "",
    x: 1920,
    y: 1200,
    par: 1,
    duration: 0,
    frameRate: 25
    };


//FUNCTIONS:
//Initialization:
function createMainFolder()
{
    for(var i = 1; i < proj.items.length; i++)
    {
        if(proj.items[i].name == compFolderName)
        {
            compFolder = proj.items[i];
            return;
        }   
    }
    compFolder= proj.items.addFolder(compFolderName);
}


//Gui elements:
function createSlider(panel, name, minmax, defaultValue , linkValue)
{
    var group = panel.add("group", undefined, name.replace(/\s+/g, ''));
        var title = group.add("statictext", undefined, name);
        var slider = group.add("slider", undefined, {name:'slider'});
        var textValue = group.add("edittext", undefined, defaultValue);
        
     group.orientation = "row";
     slider.value = defaultValue;
     slider.minvalue = minmax[0];
     slider.maxvalue = minmax[1];
     
     textValue.characters = 6;
        
     slider.onChanging= function () { linkValue.value = slider.value; textValue.text = linkValue.value.toFixed(2);};
     slider.onChange = function() {refreshComp( )};
     textValue.onChanging= function () { linkValue.value = parseFloat(textValue.text); slider.value = linkValue.value;};
     
     return group; 
}


  
  //Functionality:
  
function createNewFullComp()
{
    var currentTime = 0;
    var currentLayer = null;
    var currentFolder = proj.activeItem;
    var randomness = 0;
    var currentCompDuration = 1;
    var compName = "";
    var scaledFootage = null;
    footageTypeList = [];
    
     if (!currentFolder || !(currentFolder instanceof FolderItem))
    {
        alert("Select a folder motherfuka!!");
        return;
    }
    compAttrs.duration = imageDuration.value* (currentFolder.numItems-1);
    
    if(compAttrs.name != "" )
    {
        compName = compAttrs.name + "-" + compNumber;
    } 
    else 
    {
        compName = currentFolder.name  + "_SequenceComp-" + compNumber;
    }
    currentComp = proj.items.addComp(compName ,compAttrs.x, compAttrs.y, compAttrs.par, compAttrs.duration, compAttrs.frameRate); 
    currentComp.parentFolder = compFolder;
    compNumber ++;
    
    for (var i=1; i <= currentFolder.numItems; i++)
    {
        scaledFootage = currentComp.layers.add(currentFolder.items[i], imageDuration.value);
        imageSizeToCompSize(scaledFootage )
        
        if(currentFolder.items[i].duration != 0)
        {
            footageTypeList.push(true);     
        }
        else
        {
            footageTypeList.push(false);
        }
    }

    footageTypeList.reverse();
    
    refreshComp();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function refreshComp( )
{
    var startTime= 0;  
    var layerDuration = 0;
    var currentLayer = currentComp.layer(currentComp.numLayers);
    var previousLayer = null;
    

    deleteAllKeys(); 
    currentLayer.startTime = 0;
    currentLayer.outPoint = setLayerDuration(footageTypeList[footageTypeList.length ]);
    addStartTransitionKeys(currentLayer);
    
    for(var i = currentComp.numLayers -1 ; i > 0; i--)
    {
        currentLayer = currentComp.layer(i);
        previousLayer = currentComp.layer(i +1);
        
        startTime = previousLayer.outPoint - transitionDuration.value;
        duration = startTime + setLayerDuration(footageTypeList[i-1]);
        currentLayer.startTime = startTime;
        currentLayer.outPoint = duration;
        addStartTransitionKeys(currentLayer);
    }
    currentComp.duration = currentComp.layer(1).outPoint;  
}

function selectComp()
{
        if (!(proj.activeItem instanceof CompItem))
        {
            alert("Select a comp")
            return;
        }
    
        currentComp = proj.activeItem;
}    

function imageSizeToCompSize( layerObj){

          var curLayerBoundry, curLayerScale, newLayerScale;
          curLayerBoundry = layerObj.sourceRectAtTime(layerObj.startTime,false);
          curLayerScaleObj = layerObj.property("ADBE Transform Group").property("ADBE Scale");
          curLayerScaleVal = curLayerScaleObj.value;
          newLayerScale = curLayerScaleVal*Math.max(currentComp.width/curLayerBoundry.width, currentComp.height/curLayerBoundry.height);
          curLayerScaleObj.setValue(newLayerScale);
}


function setLayerDuration(type)
{
    var duration = 0;
    var randomness = 0;
    if(type)
    {
        randomness =  randomFloatInRange(0, videoRandomDuration.value);
        duration = videoDuration.value + randomness;
    }
    else
    {
        randomness =  randomFloatInRange(0, imageRandomDuration.value);
        duration = imageDuration.value + randomness;
    }
    return duration;
}

function addStartTransitionKeys(layer)
{
    var prop = layer.property("ADBE Transform Group").property(simpleTransitionProperty.value);
    var start = {time: layer.startTime, value:0};
    var end = {time: start.time + transitionDuration.value, value: 100};
    
    prop.setValueAtTime(start.time, start.value);
    prop.setValueAtTime(end.time, end.value);
}   

function deleteAllKeys()
{
    var currentProperty = null;
    
    for(var i = 1; i <= currentComp.numLayers; i++ )
    {
        currentProperty = currentComp.layer(i).property("ADBE Transform Group").property(simpleTransitionProperty.value);
        if(currentProperty.numKeys != 0)
        {    
            for(var k = currentProperty.numKeys; k > 0; k--)
            {
                currentProperty.removeKey(k);
            }
        }
    }    
}

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  

function addMovementTransition()
{
    var currentTime= 0;
}

//Math:
function randomFloatInRange(min, max) {
    return Math.random() * (max - min) + min;
}



//--------------Gui---------------------------------------------------------------------------------------------------------//
//Main window:
var mainPalette = (this instanceof Panel) ? this : new Window("palette", "Sequencer", undefined, {resizeable:true});
    //Duration Group:
    var durationGroup = mainPalette.add("panel", undefined, "Main Config");
        //Image Duration Group:
        var imageDurationGroup = durationGroup.add("group", undefined, 'ImageDurationGroup');
            var imageDurationSlider = createSlider(durationGroup, 'Image Duration Secs',[minImageDuration, maxImageDuration], imageDurationDefault, imageDuration);
            var imageRandomDurationSlider = createSlider(durationGroup, 'Image RD', [0, maxImageRandomDuration], 0, imageRandomDuration);
            var videoDurationSlider = createSlider(durationGroup, 'Video Duration Secs',[minVideoDuration, maxVideoDuration], videoDurationDefault, videoDuration);
            var videoRandomDurationSlider = createSlider(durationGroup, 'Video RD', [0, maxVideoRandomDuration], 0, videoRandomDuration);
            var transitionDurationSlider = createSlider(durationGroup, 'Transition Duration', [minTranstionDuration, maxTranstionDuration], 0.5, transitionDuration);     
                
            var compNameField = durationGroup.add("edittext", undefined, "CompNameField");
            compNameField.text = "Comp Name";
            compNameField.onChange = function() { compAttrs.name = compNameField.text};
            
            var createCompButton = mainPalette.add("button", undefined, 'CreateCompButton');
            var refreshCompButton = mainPalette.add("button", undefined, 'RefreshCompButton');
            var selectCompButton = mainPalette.add("button", undefined, 'SelectCompButton');
            createCompButton.text = "Create Comp";
            refreshCompButton.text = "Refresh Comp";
            selectCompButton.text = "Select Comp";

            createCompButton.onClick = function () {createNewFullComp()};
            refreshCompButton.onClick = function () {refreshComp()};
            selectCompButton.onClick = function () {selectComp()};
         
        
    mainPalette.orientation = "row"     
    durationGroup.orientation = "column";
    durationGroup.alignChildren = "right";
//--------------------------------------------------------------------------------------------------------------------------//
       
//----------Main-------------------------------------------------------//
//Setting user variables:
imageDuration.value = imageDurationSlider.children[1].value;
videoDuration.value = videoDurationSlider.children[1].value;

imageRandomDuration.value = imageRandomDurationSlider.children[1].value;
videoRandomDuration.value = videoRandomDurationSlider.children[1].value;

transitionDuration.value = transitionDurationSlider.children[1].value;
//Create Main Folder
createMainFolder();
//Display Window:
mainPalette.center();
mainPalette.show();
            


















































            //Duration Slider
//~             var imageDurationT = imageDurationGroup.add("statictext", undefined, "Image Duration:");
//~             var imageDurationSlider = imageDurationGroup.add("slider", undefined, "ImageLength");      
//~             var imageDurationTextValue = imageDurationGroup.add("edittext", undefined,  5); 
//~         //Image Random Duration Group:
//~         var imageRandomDurationGroup = durationGroup.add("group",  undefined, "ImageRandomDurationGroup");
//~             //Random Slider
//~             
//~             
//~             
//~         //Video Duration Group:
//~         var videoDurationGroup = durationGroup.add("group", undefined, "VideoDurationGroup");
//~             //Duration Slider:
//~             var videoDurationTitle = videoDurationGroup.add("statictext", undefined, "Video Duration:");
//~             var videoDurationSlider = videoDurationGroup.add("slider", undefined, "videoLength");      
//~             var videoDurationTextValue = videoDurationGroup.add("edittext", undefined,  5); 
//~             
//~ //Set elements display:
//~ durationGroup.orientation = "column";
//~ durationGroup.alignChildren = "right";
//~ imageDurationGroup.orientation = "row";    

//~ //Set initial values:
//~     //ImageDuration:
//~     imageDurationSlider.value = 5;
//~     imageDurationSlider.maxvalue = maxImageDuration;
//~     imageDurationTextValue.characters = 6;
//~     
//~     //ImageDuration:
//~     videoDurationSlider.value = 5;
//~     videoDurationSlider.maxvalue = maxVideoDuration;
//~     videoDurationTextValue.characters = 6;
//~     
//~ //EVENT HANDLERS:
//~     //ImageDuration:
//~     imageDurationSlider.onChanging= function () 
//~                                                       {
//~                                                        imageDuration = imageDurationSlider.value;
//~                                                        imageDurationTextValue.text = imageDuration.toFixed(2);
//~                                                       }
//~                                                   
//~     imageDurationTextValue.onChanging= function () 
//~                                                       {
//~                                                        imageDuration = parseFloat(imageDurationTextValue.text);
//~                                                        imageDurationSlider.value = imageDuration;
//~                                                       }
//~                                                 
//~     //VideoDuration:
//~     videoDurationSlider.onChanging= function () 
//~                                                      {
//~                                                       videoDuration = videoDurationSlider.value.toFixed(2);
//~                                                       videoDurationTextValue.text = videoDuration;
//~                                                      }
//~                                                  
//~     videoDurationTextValue.onChanging= function () 
//~                                                       {
//~                                                        videoDuration = parseFloat(videoDurationTextValue.text);
//~                                                        videoDurationSlider.value = videoDuration;
//~                                                       }


