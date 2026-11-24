import { NextResponse } from "next/server";
import {
  defaultFinancialHealth,
  initialBoardCardsData,
  BoardCardItem
} from "@/data/overviewData";

export const dynamic = "force-dynamic";

let boardCardsState: BoardCardItem[] = [...initialBoardCardsData];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const curator = searchParams.get("curator");
    const needsAction = searchParams.get("needsAction");
    const departing7Days = searchParams.get("departing7Days");

    let filtered = [...boardCardsState];

    if (curator === "mine") {
      filtered = filtered.filter((c) => c.isMine);
    } else if (curator && curator !== "all") {
      filtered = filtered.filter((c) => c.curator.toLowerCase().includes(curator.toLowerCase()));
    }

    if (needsAction === "true") {
      filtered = filtered.filter((c) => c.needsAction);
    }

    if (departing7Days === "true") {
      filtered = filtered.filter((c) => c.departingIn7Days);
    }

    const columns = [
      {
        id: "request",
        title: "REQUEST",
        count: filtered.filter((c) => c.stage === "request").length,
        cards: filtered.filter((c) => c.stage === "request")
      },
      {
        id: "sourcing",
        title: "SOURCING",
        count: filtered.filter((c) => c.stage === "sourcing").length,
        cards: filtered.filter((c) => c.stage === "sourcing")
      },
      {
        id: "quoted",
        title: "QUOTED",
        count: filtered.filter((c) => c.stage === "quoted").length,
        cards: filtered.filter((c) => c.stage === "quoted")
      },
      {
        id: "booked",
        title: "BOOKED",
        count: filtered.filter((c) => c.stage === "booked").length,
        cards: filtered.filter((c) => c.stage === "booked")
      },
      {
        id: "confirmed",
        title: "CONFIRMED",
        count: filtered.filter((c) => c.stage === "confirmed").length,
        cards: filtered.filter((c) => c.stage === "confirmed")
      },
      {
        id: "flown_close",
        title: "FLOWN · CLOSE",
        count: filtered.filter((c) => c.stage === "flown_close").length,
        cards: filtered.filter((c) => c.stage === "flown_close")
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        financialHealth: defaultFinancialHealth,
        columns,
        totalCards: filtered.length
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load board data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const { cardId, stage } = payload || {};

    if (!cardId || !stage) {
      return NextResponse.json(
        { success: false, message: "Missing cardId or stage" },
        { status: 400 }
      );
    }

    const cardIndex = boardCardsState.findIndex((c) => c.id === cardId || c.code === cardId);
    if (cardIndex !== -1) {
      boardCardsState[cardIndex].stage = stage;
      return NextResponse.json({
        success: true,
        message: "Card stage updated",
        card: boardCardsState[cardIndex]
      });
    }

    const newCard: BoardCardItem = {
      id: cardId,
      code: cardId,
      route: "DIRECT",
      details: "Updated stage",
      badge: null,
      badgeVariant: null,
      stage,
      curator: "Desk",
      isMine: false,
      needsAction: false,
      departingIn7Days: true,
      linkUrl: `/requests/${cardId}`,
      order: 1
    };
    boardCardsState.push(newCard);

    return NextResponse.json({
      success: true,
      message: "Card created and assigned to stage",
      card: newCard
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update card stage" },
      { status: 500 }
    );
  }
}
