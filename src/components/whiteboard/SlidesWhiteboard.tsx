import { useCallback, useEffect, useState } from "react";
import { Editor, TLEventMapHandler, TLFrameShape, Tldraw, createShapeId, stopEventPropagation, transact, useEditor, useValue } from "tldraw";
import "tldraw/tldraw.css";
import { SLIDE_MARGIN, SLIDE_SIZE, SlidesProvider, useSlides } from "./SlidesManager";
import { useSync } from "@tldraw/sync";
import { multiplayerAssets } from "./useSyncStore";

export default function SlideShowExample({ ...props }) {
  return (
    <SlidesProvider>
      <InsideSlidesContext {...props} />
    </SlidesProvider>
  );
}

// @ts-ignore
const isInstanceRecord = (record: TLRecord): record is { currentPageId: string } => "currentPageId" in record;

const WORKER_URL = import.meta.env.VITE_MULTI_SYNC_URL;

function InsideSlidesContext({ ...props }) {
  const { classId, occupantId } = props;

  const roomId = `${classId}-${occupantId}`;

  const store = useSync({ uri: `${WORKER_URL}/connect/${roomId}`, assets: multiplayerAssets });

  const slides = useSlides();
  const [editor, setEditor] = useState<Editor | null>(null);

  const currentSlide = useValue("currentSlide", () => slides.getCurrentSlide(), [slides]);

  useEffect(() => {
    if (!editor) return;

    const nextBounds = {
      x: currentSlide.index * (SLIDE_SIZE.w + SLIDE_MARGIN),
      y: 0,
      w: SLIDE_SIZE.w,
      h: SLIDE_SIZE.h,
    };

    // editor.zoomToFit();
    editor.setCameraOptions({
      constraints: {
        bounds: nextBounds,
        behavior: "contain",
        initialZoom: "fit-max",
        baseZoom: "fit-max",
        origin: { x: 0.5, y: 0.5 },
        padding: { x: 0, y: 0 },
      },
      isLocked: true,
    });

    editor.zoomToBounds(nextBounds, { force: true, animation: { duration: 500 } });
  }, [editor, currentSlide]);

  const currentSlides = useValue("slides", () => slides.getCurrentSlides(), [slides]);

  useEffect(() => {
    if (!editor) return;

    const ids = currentSlides.map((slide) => createShapeId(slide.id));

    transact(() => {
      for (let i = 0; i < currentSlides.length; i++) {
        const shapeId = ids[i];
        const slide = currentSlides[i];
        const shape = editor.getShape(shapeId);
        if (shape) {
          if (shape.x === slide.index * (SLIDE_SIZE.w + SLIDE_MARGIN)) continue;

          // if name is still Slide and number, e.g Slide 1, update it. Use regex to test

          const regex = /Slide \d+/;
          let name = (shape as TLFrameShape).props.name;
          if (regex.test((shape as TLFrameShape).props.name)) {
            name = `Slide ${slide.index + 1}`;
          }

          editor.updateShape<TLFrameShape>({
            id: shapeId,
            type: "frame",
            x: slide.index * (SLIDE_SIZE.w + SLIDE_MARGIN),
            props: {
              name,
            },
          });
        } else {
          editor.createShape<TLFrameShape>({
            id: shapeId,
            parentId: editor.getCurrentPageId(),
            type: "frame",
            x: slide.index * (SLIDE_SIZE.w + SLIDE_MARGIN),
            y: 0,
            props: {
              name: `Slide ${slide.index + 1}`,
              w: SLIDE_SIZE.w,
              h: SLIDE_SIZE.h,
            },
          });
        }
      }
    });

    const unsubs = [] as (() => void)[];

    unsubs.push(
      editor.sideEffects.registerBeforeChangeHandler("shape", (prev, next) => {
        if (ids.includes(next.id) && (next as TLFrameShape).props.name === (prev as TLFrameShape).props.name) return prev;
        return next;
      })
    );

    unsubs.push(
      editor.sideEffects.registerBeforeChangeHandler("instance_page_state", (prev, next) => {
        next.selectedShapeIds = next.selectedShapeIds.filter((id) => !ids.includes(id));
        if (next.hoveredShapeId && ids.includes(next.hoveredShapeId)) next.hoveredShapeId = null;
        return next;
      })
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [currentSlides, editor]);

  const handleMount = (editor: Editor) => {
    setEditor(editor);
  };

  const handlePageChangeEvent = useCallback(() => {
    if (!editor) return;

    // Handle the change event to detect page changes (including remote)
    const handleChangeEvent: TLEventMapHandler<"change"> = (change) => {
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (isInstanceRecord(from) && isInstanceRecord(to) && from.currentPageId !== to.currentPageId) {
          editor.setCurrentPage(to.currentPageId); // Switch the page in the editor
        }
      }
    };

    // Subscribe to store events for both user and remote changes
    const cleanupFunction = editor.store.listen(handleChangeEvent, { scope: "all", source: "remote" });

    return cleanupFunction; // Return the cleanup function for useEffect
  }, [editor]);

  const handleCursorChangeEvent = useCallback(() => {
    if (!editor) return;

    // editor.sideEffects.registerAfterChangeHandler("camera", (config: any) => {
    //   console.log("camera config === ", config);
    // });

    const handleChangeEvent = (events: any) => {
      console.log("events: ", events);

      //   const { changes } = events;

      // Handle updated events
      //   if (changes.updated) {
      //     for (const [key, updates] of Object.entries(changes.updated)) {
      //       // @ts-ignore
      //       updates.forEach((update: any) => {
      //         const { camera } = update;

      //         if (camera) {
      //           console.log("camera === ", camera);

      //           const { x, y, z } = camera;
      //           console.log("camera === ", camera);
      //           console.log(`Remote camera moved to: (${x}, ${y}) with zoom: ${z}`);

      //           // Adjust the camera options based on the remote user's camera position
      //           editor.setCamera(
      //             { x, y, z },
      //             {
      //               animation: { duration: 1000, easing: (t) => t * t },
      //             }
      //           );
      //         }
      //       });
      //     }
      //   }
    };

    // Subscribe to store events for both user and remote changes
    const cleanupFunction = editor.store.listen(handleChangeEvent, { scope: "all", source: "remote" });

    return cleanupFunction; // Return the cleanup function for useEffect
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    // Start listening to page changes
    const cleanup = handlePageChangeEvent();
    const cleanup1 = handleCursorChangeEvent();

    // Cleanup listener on component unmount
    return () => {
      if (cleanup) cleanup();
      if (cleanup1) cleanup1();
    };
  }, [editor]);

  return (
    <>
      <Tldraw onMount={handleMount} components={components} store={store} />
    </>
  );
}

function SlideControls() {
  const slides = useSlides();
  const editor = useEditor();

  return (
    <>
      <button
        style={{
          pointerEvents: "all",
          position: "absolute",
          bottom: "50%",
          left: 0,
          width: 50,
          height: 50,
        }}
        onPointerDown={stopEventPropagation}
        onClick={() => slides.prevSlide()}
        // onClick={() => {
        //   console.log("log...");
        //   editor.setCameraOptions({
        //     isLocked: false,
        //   });
        //   editor.setCamera({ x: -1920, y: 1, z: 1 });
        // }}
      >
        {`Prev`}
      </button>
      <button
        style={{
          pointerEvents: "all",
          position: "absolute",
          top: "50%",
          right: 0,
          width: 50,
          height: 50,
        }}
        onPointerDown={stopEventPropagation}
        onClick={() => slides.nextSlide()}
      >
        {`Next`}
      </button>
    </>
  );
}

const components = {
  //   OnTheCanvas: Slides,
  InFrontOfTheCanvas: SlideControls,
};
