import React from "react";

const WhiteboarMobileTopBar = ({
  iamModerator,
  occupants,
  onPreviewClick,
}: {
  iamModerator: boolean | null;
  occupants: Array<any>;
  onPreviewClick: Function;
}) => {
  const items = iamModerator ? occupants.filter((el) => el.role === "participant") : occupants.filter((el) => el.role === "moderator");

  return (
    <div className="mobile-topbar">
      {items.map((occupant) => (
        <div className="participant" key={occupant.id} onClick={() => onPreviewClick(occupant.id)}>
          <p>{occupant.name.charAt(0)}</p>
        </div>
      ))}
    </div>
  );
};

export { WhiteboarMobileTopBar };
