define('MyDragDropPDFWidget', ['UWA/Core', 'DS/DataDragAndDrop/DataDragAndDrop', 'DS/WAFData/WAFData', 'DS/i3DXCompassPlatformServices/i3DXCompassPlatformServices'],
function(UWA, DnD, WAFData, i3DXCompass) {
  'use strict';

  return {
    onLoad: function() {
      console.log("Widget Loaded"); // Check if the widget is loaded

      // Check if drag-and-drop functionality is available
      const dropZone = document.getElementById('drop-zone');
      
      if (dropZone) {
        console.log("Drop zone found");

        // Attach the drag-and-drop event
        DnD.attach(dropZone, {
          acceptedTypes: ['Document'],
          onDrop: function(data) {
            console.log("Drop event triggered");
            console.log("Dropped data: ", data);
          }
        });
      } else {
        console.log("Drop zone not found");
      }
    }
  };
});
