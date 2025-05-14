define('MyDragDropPDFWidget', ['UWA/Core', 'DS/DataDragAndDrop/DataDragAndDrop', 'DS/WAFData/WAFData', 'DS/i3DXCompassPlatformServices/i3DXCompassPlatformServices'],
function(UWA, DnD, WAFData, i3DXCompass) {
  'use strict';

  let droppedDocs = [];

  function createPDF(docProps) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const tableBody = docProps.map(props => [
      props.name || '',
      props.type || '',
      props.revision || '',
      props.description || ''
    ]);

    doc.text('Combined Document Properties', 10, 10);
    doc.autoTable({
      head: [['Name', 'Type', 'Revision', 'Description']],
      body: tableBody,
      startY: 20
    });

    return doc.output('blob');
  }

  function createAndCheckinPDF(blob, title) {
    const formData = {
      type: 'Document',
      name: title,
      policy: 'Document Release',
      description: 'Auto-generated PDF from dropped Documents'
    };

    // Step 1: Create Document
    WAFData.authenticatedRequest('/resources/v1/modeler/documents', {
      method: 'POST',
      type: 'json',
      data: JSON.stringify({ data: [{ attributes: formData }] }),
      headers: { 'Content-Type': 'application/json' },
      onComplete: function(response) {
        const docId = response.data[0].id;

        // Step 2: Checkin PDF
        const form = new FormData();
        form.append('file_0', blob, `${title}.pdf`);

        WAFData.authenticatedRequest(`/resources/v1/modeler/documents/${docId}/files?version=major`, {
          method: 'POST',
          data: form,
          onComplete: () => alert('PDF checked in successfully'),
          onFailure: err => console.error('Checkin failed', err)
        });
      },
      onFailure: err => console.error('Document creation failed', err)
    });
  }

  function fetchDocumentDetails(oid, callback) {
    const url = `/resources/v1/modeler/documents/${oid}`;
    WAFData.authenticatedRequest(url, {
      method: 'GET',
      type: 'json',
      onComplete: data => {
        const attrs = data.data[0].attributes;
        callback({
          id: oid,
          name: attrs.title,
          type: attrs.type,
          revision: attrs.revision,
          description: attrs.description
        });
      },
      onFailure: err => console.error('Failed to fetch document details', err)
    });
  }

  function processDrop(objects) {
    droppedDocs = [];
	console.log("Dropped objects:", objects);
    const docObjects = objects.filter(obj => obj.protocol === 'ds' && obj.objectId);
	console.log("Filtered Document Objects:", docObjects);
    if (docObjects.length !== 2) {
      alert('Please drop exactly two documents.');
      return;
    }

    let fetched = 0;
    docObjects.forEach(obj => {
      fetchDocumentDetails(obj.objectId, props => {
        droppedDocs.push(props);
        fetched++;
        if (fetched === 2) {
          const blob = createPDF(droppedDocs);
          const name = `Merged_${droppedDocs[0].name}_${droppedDocs[1].name}`;
          createAndCheckinPDF(blob, name);
        }
      });
    });
  }

  return {
    onLoad: function() {
      require(['libs/jspdf.umd.min', 'libs/jspdf.plugin.autotable.min'], function() {
        const dropZone = document.getElementById('drop-zone');
        DnD.attach(dropZone, {
          acceptedTypes: ['Document'],
          onDrop: function(data) {
            const parsedData = JSON.parse(data);
            processDrop(parsedData);
          }
        });
      });
    }
  };
});
