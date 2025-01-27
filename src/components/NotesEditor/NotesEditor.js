import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import * as actions from '../../actions';
import { isMetaKeyPressed } from '../../utils';
import useMousewheel from '../../hooks/use-mousewheel.hook';

import ReduxForwardingCanvas from '../ReduxForwardingCanvas';
import MapVisualization from '../MapVisualization';
import EditorBottomPanel from '../EditorBottomPanel';
import EditorRightPanel from '../EditorRightPanel';
import SongInfo from '../SongInfo';
import GlobalShortcuts from '../GlobalShortcuts';

import KeyboardShortcuts from './KeyboardShortcuts';
import { NOTES_VIEW } from '../../constants';

const NotesEditor = ({ isPlaying, pausePlaying, scrollThroughSong }) => {
  const canvasRef = React.useRef(null);

  useMousewheel(canvasRef, true, ev => {
    // Ignore mousewheels when the ctrl key is held.
    // Those mousewheel events will be captured above, for changing the
    // snapping.
    if (isMetaKeyPressed(ev)) {
      return;
    }

    ev.preventDefault();

    const direction = ev.deltaY < 0 ? 'forwards' : 'backwards';

    if (!isPlaying) {
      scrollThroughSong(direction);
    }
  });

  return (
    <Wrapper>
      <SongInfo showDifficultySelector />

      <ReduxForwardingCanvas ref={canvasRef}>
        <MapVisualization />
      </ReduxForwardingCanvas>

      <EditorBottomPanel />
      <EditorRightPanel />

      <GlobalShortcuts view={NOTES_VIEW} />
      <KeyboardShortcuts />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  background: #000;
  width: 100%;
  height: 100%;
`;

const mapStateToProps = state => ({
  isPlaying: state.navigation.isPlaying,
});

const mapDispatchToProps = {
  pausePlaying: actions.pausePlaying,
  scrollThroughSong: actions.scrollThroughSong,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NotesEditor);
