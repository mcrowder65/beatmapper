import React from 'react';
import { connect } from 'react-redux';
import * as THREE from 'three';

import * as actions from '../../actions';
import { range } from '../../utils';
import { getCursorPositionInBeats } from '../../reducers/navigation.reducer';

import { getDirectionForDrag } from './PlacementGrid.helpers';

import TentativeObstacle from './TentativeObstacle';

const PlacementGrid = ({
  width,
  height,
  position,
  cursorPositionInBeats,
  selectedDirection,
  selectedTool,
  selectionMode,
  clickPlacementGrid,
  setBlockByDragging,
  createNewObstacle,
}) => {
  const NUM_ROWS = 3;
  const NUM_COLS = 4;

  const [mouseDownAt, setMouseDownAt] = React.useState(null);
  const [mouseOverAt, setMouseOverAt] = React.useState(null);
  const cachedDirection = React.useRef(null);

  // `hoveredCell` is an indication of which square is currently highlighted
  // by the cursor. You might think I could just use `mouseOverAt`, but
  // there are 2 reasons why I can't:
  // - When clicking and dragging to place a cell, I want to 'lock'
  //   hoveredCell, even though I'm still mousing over other cells
  // - A weird bug (maybe?) means that mouseOver events can fire BEFORE
  //   mouseOut events (on the cell being leaved). So I get buggy flickering
  //   if I don't use this derived value.
  const [hoveredCell, setHoveredCell] = React.useState(null);

  React.useEffect(() => {
    const handleMouseMove = ev => {
      const { rowIndex, colIndex, ...initialPosition } = mouseDownAt;

      if (selectedTool !== 'red-block' && selectedTool !== 'blue-block') {
        return;
      }

      const currentPosition = {
        x: ev.pageX,
        y: ev.pageY,
      };

      const direction = getDirectionForDrag(initialPosition, currentPosition);

      if (
        typeof direction === 'number' &&
        direction !== cachedDirection.current
      ) {
        // Mousemoves register very quickly; dozens of identical events might
        // be submitted if we don't stop it, causing a backlog to accumulate
        // on the main thread.
        if (cachedDirection.current === direction) {
          return;
        }

        setBlockByDragging(
          direction,
          rowIndex,
          colIndex,
          cursorPositionInBeats,
          selectedTool
        );

        cachedDirection.current = direction;
      }
    };

    const handleMouseUp = ev => {
      window.requestAnimationFrame(() => {
        setMouseDownAt(null);
        setMouseOverAt(null);
        setHoveredCell(null);
        cachedDirection.current = null;
      });
    };

    if (mouseDownAt) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line
  }, [mouseDownAt, selectedTool]);

  return (
    <>
      {range(NUM_ROWS).map(rowIndex =>
        range(NUM_COLS).map(colIndex => {
          const cellSize = width / 4;
          const paddedCellSize = cellSize - width * 0.01;

          const isHovered =
            hoveredCell &&
            hoveredCell.rowIndex === rowIndex &&
            hoveredCell.colIndex === colIndex;

          return (
            <mesh
              key={`${rowIndex}-${colIndex}`}
              position={[
                position[0] - cellSize * 1.5 + colIndex * cellSize,
                position[1] - cellSize * 1 + rowIndex * cellSize,
                position[2],
              ]}
              onClick={ev => {
                ev.stopPropagation();

                // If we're in the process of selecting/deselecting/deleting
                // notes, and the user happens to finish while over the
                // placement grid, don't create new blocks.
                if (selectionMode) {
                  return;
                }

                // Because this is really one big canvas, `onClick`
                // fires even if the mouse starts somewhere else and
                // releases over a placement grid tile.
                // This causes problems when resizing obstacles.
                if (!mouseDownAt) {
                  return;
                }

                // If we're adding an obstacle, we use the other handlers
                if (selectedTool === 'obstacle') {
                  return;
                }

                // If we clicked down on one grid and up on another, don't
                // count it.
                if (
                  mouseDownAt &&
                  (mouseDownAt.rowIndex !== rowIndex ||
                    mouseDownAt.colIndex !== colIndex)
                ) {
                  return;
                }

                clickPlacementGrid(
                  rowIndex,
                  colIndex,
                  cursorPositionInBeats,
                  selectedDirection,
                  selectedTool
                );
              }}
              onPointerDown={ev => {
                // Only pay attention to left-clicks when it comes to the
                // placement grid. Right-clicks should pass through.
                if (ev.buttons !== 1) {
                  return;
                }

                // If the user is placing an obstacle, the idea of a hovered
                // cell suddenly doesn't make as much sense.
                if (selectedTool === 'obstacle' && isHovered) {
                  setHoveredCell(null);
                }

                ev.stopPropagation();

                setMouseDownAt({
                  rowIndex,
                  colIndex,
                  x: ev.pageX,
                  y: ev.pageY,
                });
              }}
              onPointerUp={ev => {
                if (
                  selectedTool === 'obstacle' &&
                  ev.button === 0 &&
                  mouseDownAt
                ) {
                  ev.stopPropagation();

                  createNewObstacle(
                    mouseDownAt,
                    { rowIndex, colIndex },
                    cursorPositionInBeats
                  );
                }
              }}
              onPointerOver={ev => {
                setMouseOverAt({ rowIndex, colIndex });

                // Don't update 'hoveredCell' if I'm clicking and dragging
                // a block
                if (!mouseDownAt) {
                  setHoveredCell({ rowIndex, colIndex });
                }
              }}
              onPointerOut={ev => {
                // If the user is in the middle of placing a block, ignore
                // this event
                if (mouseDownAt) {
                  return;
                }

                // A strange quirk/bug can mean that the `pointerOut` event
                // fires AFTER the user has already entered a new cell.
                // Only unset the hovered cell if they haven't already
                // moved onto a new cell.
                if (isHovered) {
                  setHoveredCell(null);
                }
              }}
            >
              <planeGeometry
                attach="geometry"
                args={[paddedCellSize, paddedCellSize, 1, 1]}
              />
              <meshBasicMaterial
                attach="material"
                color={0xffffff}
                transparent={true}
                opacity={isHovered ? 0.2 : 0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })
      )}

      {mouseDownAt && selectedTool === 'obstacle' && (
        <TentativeObstacle
          mouseDownAt={mouseDownAt}
          mouseOverAt={mouseOverAt}
          cursorPositionInBeats={cursorPositionInBeats}
        />
      )}
    </>
  );
};

const mapStateToProps = state => ({
  cursorPositionInBeats: getCursorPositionInBeats(state),
  selectedDirection: state.editor.notes.selectedDirection,
  selectedTool: state.editor.notes.selectedTool,
  selectionMode: state.editor.notes.selectionMode,
});

export default connect(
  mapStateToProps,
  {
    clickPlacementGrid: actions.clickPlacementGrid,
    setBlockByDragging: actions.setBlockByDragging,
    createNewObstacle: actions.createNewObstacle,
  }
)(PlacementGrid);
