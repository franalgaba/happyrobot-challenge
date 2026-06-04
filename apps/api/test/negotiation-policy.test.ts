import { describe, expect, it } from "vitest";
import { decideNegotiation } from "../src/services/negotiations";

describe("negotiation policy", () => {
  it("counters above the first-round target", () => {
    expect(
      decideNegotiation({
        targetRate: 2250,
        maxAutoRate: 2500,
        previousRoundCount: 0,
        carrierOfferRate: 2600,
      }),
    ).toMatchObject({
      decision: "counter",
      currentRound: 1,
      counterRate: 2250,
      remainingRounds: 2,
    });
  });

  it("accepts within the current threshold and returns transfer mock", () => {
    expect(
      decideNegotiation({
        targetRate: 2250,
        maxAutoRate: 2500,
        previousRoundCount: 1,
        carrierOfferRate: 2350,
      }),
    ).toMatchObject({
      decision: "transfer_mock",
      currentRound: 2,
      agreedRate: 2350,
      message: "All set. I have you booked on this load at $2,350.",
    });
  });

  it("rejects after the third round if still above max", () => {
    expect(
      decideNegotiation({
        targetRate: 2250,
        maxAutoRate: 2500,
        previousRoundCount: 2,
        carrierOfferRate: 2600,
      }),
    ).toMatchObject({
      decision: "reject",
      currentRound: 3,
      remainingRounds: 0,
    });
  });
});
