import { utilities } from "dcmjs";
import CORNERSTONE_3D_TAG from "./cornerstone3DTag";
import MeasurementReport from "./MeasurementReport";

const { Length: TID300Length } = utilities.TID300;

const ORBIX_LENGTH = "OrbixLength";
const trackingIdentifierTextValue = `${CORNERSTONE_3D_TAG}:${ORBIX_LENGTH}`;

class OrbixLength {
    static getMeasurementData(
        MeasurementGroup,
        sopInstanceUIDToImageIdMap,
        imageToWorldCoords,
        metadata
    ) {
        const { defaultState, NUMGroup, SCOORDGroup, ReferencedFrameNumber } =
            MeasurementReport.getSetupMeasurementData(
                MeasurementGroup,
                sopInstanceUIDToImageIdMap,
                metadata,
                OrbixLength.toolType
            );

        const referencedImageId =
            defaultState.annotation.metadata.referencedImageId;

        const { GraphicData } = SCOORDGroup;
        const worldCoords = [];
        for (let i = 0; i < GraphicData.length; i += 2) {
            const point = imageToWorldCoords(referencedImageId, [
                GraphicData[i],
                GraphicData[i + 1]
            ]);
            worldCoords.push(point);
        }

        const state = defaultState;

        state.annotation.data = {
            handles: {
                points: [worldCoords[0], worldCoords[1]],
                activeHandleIndex: 0,
                textBox: {
                    hasMoved: false
                }
            },
            cachedStats: {
                [`imageId:${referencedImageId}`]: {
                    length: NUMGroup
                        ? convertMmToInches(
                              NUMGroup.MeasuredValueSequence.NumericValue
                          )
                        : 0
                }
            },
            frameNumber: ReferencedFrameNumber
        };

        return state;
    }

    static getTID300RepresentationArguments(tool, worldToImageCoords) {
        const { data, finding, findingSites, metadata } = tool;
        const { cachedStats = {}, handles } = data;

        const { referencedImageId } = metadata;

        if (!referencedImageId) {
            throw new Error(
                "OrbixLength.getTID300RepresentationArguments: referencedImageId is not defined"
            );
        }

        const start = worldToImageCoords(referencedImageId, handles.points[0]);
        const end = worldToImageCoords(referencedImageId, handles.points[1]);

        const point1 = { x: start[0], y: start[1] };
        const point2 = { x: end[0], y: end[1] };

        // Retrieve the distance from cachedStats and convert it to inches
        const { length: distanceInMm } =
            cachedStats[`imageId:${referencedImageId}`] || {};
        const distanceInInches = convertMmToInches(distanceInMm);

        return {
            point1,
            point2,
            distance: distanceInInches, // Use inches for distance
            trackingIdentifierTextValue,
            finding,
            findingSites: findingSites || []
        };
    }
}

// Helper function to convert mm to inches
function convertMmToInches(mm) {
    return mm / 25.4;
}

OrbixLength.toolType = ORBIX_LENGTH;
OrbixLength.utilityToolType = ORBIX_LENGTH;
OrbixLength.TID300Representation = TID300Length;
OrbixLength.isValidCornerstoneTrackingIdentifier = TrackingIdentifier => {
    if (!TrackingIdentifier.includes(":")) {
        return false;
    }

    const [cornerstone3DTag, toolType] = TrackingIdentifier.split(":");

    if (cornerstone3DTag !== CORNERSTONE_3D_TAG) {
        return false;
    }

    return toolType === ORBIX_LENGTH;
};

MeasurementReport.registerTool(OrbixLength);

export default OrbixLength;
