import './App.css';
import { vec3, quat, mat4 } from 'gl-matrix';

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageCroppingWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImageCroppingWidget';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkPiecewiseGaussianWidget from '@kitware/vtk.js/Interaction/Widgets/PiecewiseGaussianWidget';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import head from './head';


function chest() {
  const controlPanel = `
<table class='t1'>
  <tr>
    <td>pickable</td>
    <td>
      <input class='flag' data-name="pickable" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>visibility</td>
    <td>
      <input class='flag' data-name="visibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>contextVisibility</td>
    <td>
      <input class='flag' data-name="contextVisibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>handleVisibility</td>
    <td>
      <input class='flag' data-name="handleVisibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
  <td>faceHandlesEnabled</td>
  <td>
    <input class='flag' data-name="faceHandlesEnabled" type="checkbox" checked />
  </td>
  </tr>
  <tr>
  <td>edgeHandlesEnabled</td>
  <td>
    <input class='flag' data-name="edgeHandlesEnabled" type="checkbox" checked />
  </td>
  </tr>
  <tr>
  <td>cornerHandlesEnabled</td>
  <td>
    <input class='flag' data-name="cornerHandlesEnabled" type="checkbox" checked />
  </td>
 
  </table>
<style>
.t1 {background-color: black;
  margin-top:120px;color:white;zindex:"3"}

</style

  `;
  
  

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const apiRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();
  
  global.renderer = renderer;
  global.renderWindow = renderWindow;
  
  // ----------------------------------------------------------------------------
  // 2D overlay rendering
  // ----------------------------------------------------------------------------
  
  const overlaySize = 15;
  const overlayBorder = 2;
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.width = `${overlaySize}px`;
  overlay.style.height = `${overlaySize}px`;
  overlay.style.border = `solid ${overlayBorder}px red`;
  overlay.style.borderRadius = '50%';
  overlay.style.left = '-100px';
  overlay.style.pointerEvents = 'none';
  document.querySelector('body').appendChild(overlay);
  
  // ----------------------------------------------------------------------------
  // Widget manager
  // ----------------------------------------------------------------------------
  
  const widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(renderer);
  
  const widget = vtkImageCroppingWidget.newInstance();
  
  function widgetRegistration(e) {
    const action = e ? e.currentTarget.dataset.action : 'addWidget';
    const viewWidget = widgetManager[action](widget);
    if (viewWidget) {
      viewWidget.setDisplayCallback((coords) => {
        overlay.style.left = '-100px';
        if (coords) {
          const [w, h] = apiRenderWindow.getSize();
          overlay.style.left = `${Math.round(
            (coords[0][0] / w) * window.innerWidth -
              overlaySize * 0.5 -
              overlayBorder
          )}px`;
          overlay.style.top = `${Math.round(
            ((h - coords[0][1]) / h) * window.innerHeight -
              overlaySize * 0.5 -
              overlayBorder
          )}px`;
        }
      });
  
      renderer.resetCamera();
      renderer.resetCameraClippingRange();
    }
    widgetManager.enablePicking();
    renderWindow.render();
  }
  
  // Initial widget register
  widgetRegistration();
  
  // ----------------------------------------------------------------------------
  // Volume rendering
  // ----------------------------------------------------------------------------
  
  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  
  const actor = vtkVolume.newInstance();
  const mapper = vtkVolumeMapper.newInstance();
  mapper.setSampleDistance(1.1);
  actor.setMapper(mapper);
  
  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
  ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
  ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(255.0, 1.0);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
  actor.getProperty().setInterpolationTypeToLinear();
  actor.getProperty().setUseGradientOpacity(0, true);
  actor.getProperty().setGradientOpacityMinimumValue(0, 2);
  actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
  actor.getProperty().setGradientOpacityMaximumValue(0, 20);
  actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
  actor.getProperty().setShade(true);
  actor.getProperty().setAmbient(0.2);
  actor.getProperty().setDiffuse(0.7);
  actor.getProperty().setSpecular(0.3);
  actor.getProperty().setSpecularPower(8.0);
  
  mapper.setInputConnection(reader.getOutputPort());
  
  // -----------------------------------------------------------
  // Get data
  // -----------------------------------------------------------
  
  function getCroppingPlanes(imageData, ijkPlanes) {
    const rotation = quat.create();
    mat4.getRotation(rotation, imageData.getIndexToWorld());
  
    const rotateVec = (vec) => {
      const out = [0, 0, 0];
      vec3.transformQuat(out, vec, rotation);
      return out;
    };
  
    const [iMin, iMax, jMin, jMax, kMin, kMax] = ijkPlanes;
    const origin = imageData.indexToWorld([iMin, jMin, kMin]);
    // opposite corner from origin
    const corner = imageData.indexToWorld([iMax, jMax, kMax]);
    return [
      // X min/max
      vtkPlane.newInstance({ normal: rotateVec([1, 0, 0]), origin }),
      vtkPlane.newInstance({ normal: rotateVec([-1, 0, 0]), origin: corner }),
      // Y min/max
      vtkPlane.newInstance({ normal: rotateVec([0, 1, 0]), origin }),
      vtkPlane.newInstance({ normal: rotateVec([0, -1, 0]), origin: corner }),
      // X min/max
      vtkPlane.newInstance({ normal: rotateVec([0, 0, 1]), origin }),
      vtkPlane.newInstance({ normal: rotateVec([0, 0, -1]), origin: corner }),
    ];
  }
  
  reader.setUrl(`https://kitware.github.io/vtk-js/data/volume/LIDC2.vti`).then(() => {
    reader.loadData().then(() => {
      const image = reader.getOutputData();
  
      // update crop widget
      widget.copyImageDataDescription(image);
      const cropState = widget.getWidgetState().getCroppingPlanes();
      cropState.onModified(() => {
        const planes = getCroppingPlanes(image, cropState.getPlanes());
        mapper.removeAllClippingPlanes();
        planes.forEach((plane) => {
          mapper.addClippingPlane(plane);
        });
        mapper.modified();
      });
  
      // add volume to renderer
      renderer.addVolume(actor);
      renderer.resetCamera();
      renderer.resetCameraClippingRange();
      renderWindow.render();
    });
  });


  //----------------transfer function-----------------------///
//////////////////////////////////////////////////////////////////////////////////
const rootContainer = document.querySelector(
  '.vtk-js-example-piecewise-gaussian-widget2'
);
const containerStyle = rootContainer ? { height: '100%' } : null;
const urlToLoad = rootContainer
  ? rootContainer.dataset.url ||
    'https://kitware.github.io/vtk-js/data/volume/LIDC2.vti'
  : `https://kitware.github.io/vtk-js/data/volume/LIDC2.vti`;




// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const body = rootContainer || document.querySelector('body');

// Create Widget container
const widgetContainer = document.createElement('div');
widgetContainer.style.position = 'absolute';
widgetContainer.style.top = 'calc(10px + 1em)';
widgetContainer.style.left = '5px';
widgetContainer.style.background = 'rgba(255, 255, 255, 0.3)';
widgetContainer.style.marginLeft='1050px';
body.appendChild(widgetContainer);

// Create Label for preset
const labelContainer = document.createElement('div');
labelContainer.style.position = 'absolute';
labelContainer.style.top = '5px';
labelContainer.style.left = '5px';
labelContainer.style.width = '100%';
labelContainer.style.color = 'white';
labelContainer.style.textAlign = 'center';
labelContainer.style.userSelect = 'none';
labelContainer.style.cursor = 'pointer';
labelContainer.style.marginTop='100px';
body.appendChild(labelContainer);

let presetIndex = 1;
const globalDataRange = [0, 255];
const lookupTable = vtkColorTransferFunction.newInstance();

function changePreset(delta = 1) {
  presetIndex =
    (presetIndex + delta + vtkColorMaps.rgbPresetNames.length) %
    vtkColorMaps.rgbPresetNames.length;
  lookupTable.applyColorMap(
    vtkColorMaps.getPresetByName(vtkColorMaps.rgbPresetNames[presetIndex])
  );
  lookupTable.setMappingRange(...globalDataRange);
  lookupTable.updateRange();
  labelContainer.innerHTML = vtkColorMaps.rgbPresetNames[presetIndex];
}

let intervalID = null;
function stopInterval() {
  if (intervalID !== null) {
    clearInterval(intervalID);
    intervalID = null;
  }
}

labelContainer.addEventListener('click', (event) => {
  if (event.pageX < 200) {
    stopInterval();
    changePreset(-1);
  } else {
    stopInterval();
    changePreset(1);
  }
});

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const widget2 = vtkPiecewiseGaussianWidget.newInstance({
  numberOfBins: 256,
  size: [400, 150],
});
widget2.updateStyle({
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  histogramColor: 'rgba(100, 100, 100, 0.5)',
  strokeColor: 'rgb(0, 0, 0)',
  activeColor: 'rgb(255, 255, 255)',
  handleColor: 'rgb(50, 150, 50)',
  buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
  buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
  buttonStrokeColor: 'rgba(0, 0, 0, 1)',
  buttonFillColor: 'rgba(255, 255, 255, 1)',
  strokeWidth: 2,
  activeStrokeWidth: 3,
  buttonStrokeWidth: 1.5,
  handleWidth: 3,
  iconSize: 20, // Can be 0 if you want to remove buttons (dblClick for (+) / rightClick for (-))
  padding: 10,
  
});

fullScreenRenderer.setResizeCallback(({ width, height }) => {
  widget2.setSize(Math.min(450, width - 10), 150);
});

const piecewiseFunction = vtkPiecewiseFunction.newInstance();

// const actor = vtkVolume.newInstance();
// const mapper = vtkVolumeMapper.newInstance({ sampleDistance: 1.1 });
// const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

reader.setUrl(urlToLoad).then(() => {
  reader.loadData().then(() => {
    const imageData = reader.getOutputData();
    const dataArray = imageData.getPointData().getScalars();
    const dataRange = dataArray.getRange();
    globalDataRange[0] = dataRange[0];
    globalDataRange[1] = dataRange[1];

    // Update Lookup table
    changePreset();

    // Automatic switch to next preset every 5s
    if (!rootContainer) {
      intervalID = setInterval(changePreset, 5000);
    }

    widget2.setDataArray(dataArray.getData());
    widget2.applyOpacity(piecewiseFunction);

    widget2.setColorTransferFunction(lookupTable);
    lookupTable.onModified(() => {
      widget2.render();
      renderWindow.render();
    });

    renderer.addVolume(actor);
    renderer.resetCamera();
    renderer.getActiveCamera().elevation(70);
    renderWindow.render();
  });
});

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

actor.getProperty().setRGBTransferFunction(0, lookupTable);
actor.getProperty().setScalarOpacity(0, piecewiseFunction);
actor.getProperty().setInterpolationTypeToFastLinear();

// ----------------------------------------------------------------------------
// Default setting Piecewise function widget
// ----------------------------------------------------------------------------

widget2.addGaussian(0.425, 0.5, 0.2, 0.3, 0.2);
widget2.addGaussian(0.75, 1, 0.3, 0, 0);

widget2.setContainer(widgetContainer);
widget2.bindMouseListeners();

widget2.onAnimation((start) => {
  if (start) {
    renderWindow.getInteractor().requestAnimation(widget2);
  } else {
    renderWindow.getInteractor().cancelAnimation(widget2);
  }
});

widget2.onOpacityChange(() => {
  widget2.applyOpacity(piecewiseFunction);
  if (!renderWindow.getInteractor().isAnimating()) {
    renderWindow.render();
  }
});

// ----------------------------------------------------------------------------
// Expose variable to global namespace
// ----------------------------------------------------------------------------

global.widget = widget2;

///////////////////////////////////////////
  
  // -----------------------------------------------------------
  // UI control handling
  // -----------------------------------------------------------
  
  fullScreenRenderer.addController(controlPanel);
  
  function updateFlag(e) {
    const value = !!e.target.checked;
    const name = e.currentTarget.dataset.name;
    widget.set({ [name]: value }); // can be called on either viewWidget or parentWidget
  
    widgetManager.enablePicking();
    renderWindow.render();
  }
  
  const elems = document.querySelectorAll('.flag');
  for (let i = 0; i < elems.length; i++) {
    elems[i].addEventListener('change', updateFlag);
  }
  
  const buttons = document.querySelectorAll('button');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', widgetRegistration);
  }

}

export default chest;