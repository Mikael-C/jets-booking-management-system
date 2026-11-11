import { Booking } from "@/types/aviation";

export const getQuoteIterationGroupKey = (booking: Booking): string => {
  if (booking.quoteGroupId) return booking.quoteGroupId;

  const identifier = booking.quoteId || booking.quoteReference;
  const family = identifier?.replace(/-(?:V)?\d+$/i, "");
  const client = booking.client?.email || booking.client?.fullName || booking.id;
  return family ? `${family.toLowerCase()}:${client.toLowerCase()}` : `quote:${booking.id}`;
};
