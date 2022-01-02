import './App.css';
import React from "react";
import head from './head';
import Chest from './chest';
import {useState} from "react"
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import chest from './chest';

// import controlPanel from './controller.html';
 function App() {
  //   const controlPanel = ` <div style={{
  //       zIndex:"2", 
  //       position: "absolute"
  //   }}>
    
  //   <table>
  //   <tr>
  //     <td>Iso value</td>
  //     <td>
  //       <input class='isoValue' type="range" min="0.0" max="1.0" step="0.05" value="0.0" />
  //     </td>
  //   </tr>
  // </table>
  //        <button onclick="(clickchest)">Chest</button>
      
  // </div>`;


 
//   const [ opacity, setOpacity ] = useState(2);
  
const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();



// fullScreenRenderWindow.addController(controlPanel);

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
const marchingCube = vtkImageMarchingCubes.newInstance({
  contourValue: 0.0,
  computeNormals: true,
  mergePoints: true,
});

actor.setMapper(mapper);
mapper.setInputConnection(marchingCube.getOutputPort());

function updateIsoValue(e) {
  const isoValue = Number(e.target.value);
  marchingCube.setContourValue(isoValue);
  renderWindow.render();
}

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
marchingCube.setInputConnection(reader.getOutputPort());

reader
  .setUrl(`https://kitware.github.io/vtk-js/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    const dataRange = data.getPointData().getScalars().getRange();
    const firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

    const el = document.querySelector('.isoValue');
    el.setAttribute('min', dataRange[0]);
    el.setAttribute('max', dataRange[1]);
    el.setAttribute('value', firstIsoValue);
    el.addEventListener('input', updateIsoValue);

    marchingCube.setContourValue(firstIsoValue);
    renderer.addActor(actor);
    renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
    renderer.resetCamera();
    renderWindow.render();
  });
  const clickchest =()=>{
    chest()
  }
  const clickhead =()=>{
    head()
  }
 

  return (
    <div style={{
      zIndex:"2", 
      position: "relative"
  }}>
    <h1 style={{color:"white",textAlign:'center',display:'inline', zIndex:"2",backgroundColor:"black"}}
    
    >
     Computer Graphics 
    </h1>
  
  <table style={{
  background:"black",
  color:"white",
  marginLeft:25,
  width:100,
  }
    
  }>
    
  <tr>
    <td>Iso value</td>
    <td>
      <input class='isoValue' type="range" min="0.0" max="0.0" step="0.05" defaultvalue="0.0" />
    </td>
  </tr>
  <tr>
  <button style={{width:"150px"}} onClick={clickhead}>Skull</button>
  <button style={{width:"150px"}} onClick={clickchest}>Chest</button>
  

  </tr>
</table>
    
</div> 
    
      );
 }


export default App;
