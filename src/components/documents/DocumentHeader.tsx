"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { Letterhead } from "./docKit";

interface DocumentHeaderProps {
  booking?: Booking;
}

/** Letterhead used by every document (company details from Settings). */
export default function DocumentHeader(_props: DocumentHeaderProps) {
  return <Letterhead />;
}
