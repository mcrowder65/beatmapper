import React from 'react';
import { useSpring, animated } from 'react-spring/three';

const ON_PROPS = { emissiveIntensity: 0.75, opacity: 0.75 };
const OFF_PROPS = { emissiveIntensity: 0, opacity: 0.5 };
const BRIGHT_PROPS = { emissiveIntensity: 1, opacity: 1 };

const getIntensityInfoForStatus = status => {
  switch (status) {
    case 'off':
      return {
        to: OFF_PROPS,
        immediate: true,
        reset: false,
      };

    case 'on': {
      return {
        to: ON_PROPS,
        immediate: true,
        reset: false,
      };
    }

    case 'flash': {
      return {
        from: BRIGHT_PROPS,
        to: ON_PROPS,
        immediate: false,
        reset: false,
      };
    }

    case 'fade': {
      return {
        from: BRIGHT_PROPS,
        to: OFF_PROPS,
        immediate: false,
        reset: false,
      };
    }

    default:
      throw new Error('Unrecognized status: ' + status);
  }
};

const LaserBeam = ({
  color,
  position,
  rotation,
  brightness,
  status,
  lastEventId,
}) => {
  const radius = 0.35;
  const height = 500;

  // ~~Complicated Business~~
  // This component renders super often, since its `rotation` can change on
  // every frame.
  //
  // When certain statuses occur - flash, fade - we want to reset the spring,
  // so that it does the "from" and "to" again. This should happen even when
  // the status hasn't changed (eg. a series of `flash` events in a row should
  // all trigger the reset, and get momentarily brighter).
  //
  // If I just set `reset: true` based on the status, though, then it resets
  // _on every frame_, meaning that the value is just perpetually locked to the
  // `from` value. So I need to let a single render pass when `reset` is true.
  //
  // I cache the event ID so that I can distinguish the first render after it
  // changes. When that happens, I set `reset` to true and update the cache,
  // so that the next render sets it back to `false`.
  //
  // This feels hacky, but I don't know of a better way.
  let springConfig = getIntensityInfoForStatus(status);

  const cachedEventId = React.useRef(lastEventId);

  React.useEffect(() => {
    const lastEventIdChanged = lastEventId !== cachedEventId.current;

    if (lastEventIdChanged) {
      const statusShouldReset = status === 'flash' || status === 'fade';

      springConfig.reset = statusShouldReset;

      cachedEventId.current = lastEventId;
    }
  });

  const spring = useSpring(springConfig);

  return (
    <group>
      <mesh position={position} rotation={rotation}>
        <cylinderGeometry attach="geometry" args={[radius, radius, height]} />
        <animated.meshLambertMaterial
          attach="material"
          emissive={color}
          transparent={true}
          {...spring}
        />
      </mesh>
    </group>
  );
};

export default LaserBeam;