import { Tldraw } from "tldraw";
import { useSyncDemo } from "@tldraw/sync";

const TestBoard = () => {
  const store = useSyncDemo({ roomId: "my-unique-room-id" });
  return (
    <div style={{ width: "95vw", height: "95vh", boxSizing: "border-box", alignSelf: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", height: "100%" }}>
        <Tldraw store={store} />
        <Tldraw store={store} />;
      </div>
    </div>
  );
};

export { TestBoard };
