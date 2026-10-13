// Preserve complete controller frames while geometry loads. A later media-only
// update changes insertion bits without discarding door, track or head state.
export function createDriveSceneState() {
  let snapshot;
  return {
    frame(states, mechanics, available) {
      snapshot=[states.slice(),structuredClone(mechanics),available?.slice()];
      return snapshot;
    },
    media(present) {
      if(snapshot) snapshot[0]=snapshot[0].map((s,u)=>(s&~8)|(present[u]?8:0));
    },
    get snapshot(){return snapshot;},
  };
}
