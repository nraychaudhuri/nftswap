import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <PageHeader
      title="🔀 NFTSwap"
      subTitle="Exchange NFTs with other collectors"
      style={{ cursor: "pointer" }}
    />
  );
}
