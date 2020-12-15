import { imageCache, utils } from './../../src/index';
import applyPreset from './applyPreset';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

function setCTWWWC({ volumeActor, volumeUID }) {
  const volume = imageCache.getImageVolume(volumeUID);

  const { windowWidth, windowCenter } = volume.metadata.voiLut[0];

  let lower;
  let upper;

  if (windowWidth == undefined || windowCenter === undefined) {
    // Set to something so we can window level it manually.
    lower = 200;
    upper = 400;
  } else {
    lower = windowCenter - windowWidth / 2.0;
    upper = windowCenter + windowWidth / 2.0;
  }

  volumeActor
    .getProperty()
    .getRGBTransferFunction(0)
    .setMappingRange(lower, upper);
}

function setPetTransferFunction({ volumeActor, volumeUID }) {
  const rgbTransferFunction = volumeActor
    .getProperty()
    .getRGBTransferFunction(0);

  rgbTransferFunction.setRange(0, 5);

  utils.invertRgbTransferFunction(rgbTransferFunction);
}

function setCTVRTransferFunction({ volumeActor, volumeUID }) {
  const volume = imageCache.getImageVolume(volumeUID);

  const { windowWidth, windowCenter } = volume.metadata.voiLut[0];

  const lower = windowCenter - windowWidth / 2.0;
  const upper = windowCenter + windowWidth / 2.0;

  volumeActor
    .getProperty()
    .getRGBTransferFunction(0)
    .setRange(lower, upper);

  const preset = {
    name: 'CT-Bones',
    gradientOpacity: '4 0 1 985.12 1',
    specularPower: '1',
    scalarOpacity: '8 -1000 0 152.19 0 278.93 0.190476 952 0.2',
    id: 'vtkMRMLVolumePropertyNode4',
    specular: '0',
    shade: '1',
    ambient: '0.2',
    colorTransfer:
      '20 -1000 0.3 0.3 1 -488 0.3 1 0.3 463.28 1 0 0 659.15 1 0.912535 0.0374849 953 1 0.3 0.3',
    selectable: 'true',
    diffuse: '1',
    interpolation: '1',
    effectiveRange: '152.19 952',
  };

  applyPreset(volumeActor, preset);

  volumeActor.getProperty().setScalarOpacityUnitDistance(0, 2.5);
}

function setPetColorMapTransferFunction({ volumeActor }, colormap) {
  const mapper = volumeActor.getMapper();
  mapper.setSampleDistance(1.0);

  const cfun = vtkColorTransferFunction.newInstance();
  const preset = vtkColorMaps.getPresetByName(colormap);
  cfun.applyColorMap(preset);
  cfun.setMappingRange(0, 5);

  volumeActor.getProperty().setRGBTransferFunction(0, cfun);

  // Create scalar opacity function
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0, 0.0);
  ofun.addPoint(0.1, 0.9);
  ofun.addPoint(5, 1.0);

  volumeActor.getProperty().setScalarOpacity(0, ofun);
}

function getSetPetColorMapTransferFunction(colormap) {
  return ({ volumeActor }) =>
    setPetColorMapTransferFunction({ volumeActor }, colormap);
}

export {
  setCTWWWC,
  setPetTransferFunction,
  setCTVRTransferFunction,
  getSetPetColorMapTransferFunction,
};
