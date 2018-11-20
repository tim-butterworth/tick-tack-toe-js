import {
    TickTackToeStateMachine,
    Player,
    GameState,
    GameEvent,
    EventType,
    Coordinate,
    GameStatus,
    BoardRange,
} from "./tick-tack-toe-state-machine";
import { playerMoveGameEventFactory } from "../game.event.spec.factory";
import { Subject, Observable } from "rxjs";
import * as _ from "lodash";

const weave = <T>(l1: T[], l2: T[]): T[] => {
    const result: T[] = [];

    const length1 = l1.length;
    const length2 = l2.length;

    const maxLength = (length1 > length2) ? length1 : length2;

    let i = 0;

    while (i < maxLength) {
        if (i < length1) {
            result.push(l1[i]);
        }
        if (i < length2) {
            result.push(l2[i]);
        }
        i++;
    }

    return result;
}

describe("tickTackToeStateMachine", () => {
    let tickTackToeStateMachine: TickTackToeStateMachine = new TickTackToeStateMachine();

    beforeEach(() => {
        tickTackToeStateMachine = new TickTackToeStateMachine();
    });

    describe("initial state", () => {
        it("the turn is player X's", () => {
            tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                expect(gameState.turn).toEqual(Player.X);
            });
        });
        it("x moves are empty", () => {
            tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                expect(gameState.xMoves).toEqual([]);
            });
        });
        it("o moves are empty", () => {
            tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                expect(gameState.oMoves).toEqual([]);
            });
        });
        it("has an initial game status of 'PLAYING'", () => {
            tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                expect(gameState.gameStatus).toEqual(GameStatus.PLAYING);
            });
        });
    });

    describe("events", () => {
        describe("RESET", () => {
            it("sets the game state back to initial state", () => {
                let initialState: GameState;
                let subscription = tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                    initialState = gameState;
                });
                subscription.unsubscribe();
                const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();

                publisher.next({ eventType: EventType.PLAYER_MOVE, data: { x: 1, y: 1 } });

                subscription = tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                    expect(gameState).not.toEqual(initialState);
                });
                subscription.unsubscribe();

                publisher.next({ eventType: EventType.RESET });

                tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                    expect(gameState).toEqual(initialState);
                });
            });
        });

        describe("PLAYER_MOVE", () => {
            it("updates the player who's turn it is", () => {
                const event: GameEvent = {
                    eventType: EventType.PLAYER_MOVE,
                    data: {
                        x: -1,
                        y: -1,
                    }
                };

                tickTackToeStateMachine.getPublisher().next(event);

                tickTackToeStateMachine.getObservable().subscribe((gameState: GameState) => {
                    expect(gameState.turn).toEqual(Player.O);
                });
            });

            it("updates the correct moves list", () => {
                const coordinate1: Coordinate = {
                    x: -1,
                    y: -1,
                };
                const event1: GameEvent = playerMoveGameEventFactory({ data: coordinate1 });
                const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                publisher.next(event1);

                const subscription1 = observable.subscribe((gameState: GameState) => {
                    expect(gameState.xMoves).toEqual([
                        coordinate1
                    ]);
                });
                subscription1.unsubscribe();

                const coordinate2: Coordinate = {
                    x: 1,
                    y: 1,
                }
                const event2: GameEvent = playerMoveGameEventFactory({ data: coordinate2 });

                publisher.next(event2);

                observable.subscribe((gameState: GameState) => {
                    expect(gameState.oMoves).toEqual([
                        coordinate2
                    ])
                });
            });

            describe("repeated moves", () => {
                it("ignores moves already used for X", () => {
                    const coordinate: Coordinate = {
                        x: 0,
                        y: 0,
                    };

                    const event: GameEvent = playerMoveGameEventFactory({ data: coordinate });

                    const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                    const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                    publisher.next(event);
                    publisher.next(event);

                    observable.subscribe((gameState: GameState) => {
                        expect(gameState.xMoves).toEqual([coordinate]);
                        expect(gameState.oMoves).toEqual([]);
                    });
                });

                it("ignores moves already used for O", () => {
                    const coordinate1: Coordinate = {
                        x: 0,
                        y: 0,
                    };
                    const coordinate2: Coordinate = {
                        x: 1,
                        y: 1,
                    };

                    const event1: GameEvent = playerMoveGameEventFactory({ data: coordinate1 });
                    const event2: GameEvent = playerMoveGameEventFactory({ data: coordinate2 });

                    const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                    const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                    publisher.next(event1);
                    publisher.next(event2);
                    publisher.next(event2);

                    observable.subscribe((gameState: GameState) => {
                        expect(gameState.xMoves).toEqual([coordinate1]);
                        expect(gameState.oMoves).toEqual([coordinate2]);
                    });
                });
            });

            describe("when game state is a win", () => {
                it("ignores moves when X_WIN", () => {
                    //		    oxo
                    //		    ox-
                    //		    -x-
                    const xCoordinates: Coordinate[] = [
                        { x: 0, y: -1 },
                        { x: 0, y: 0 },
                        { x: 0, y: 1 },
                    ];
                    const oCoordinates: Coordinate[] = [
                        { x: -1, y: -1 },
                        { x: -1, y: 0 },
                        { x: 1, y: -1 },
                    ];
                    const moves: Coordinate[] = weave(xCoordinates, oCoordinates);

                    const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                    const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                    _.forEach(moves, (coordinate: Coordinate) => {
                        const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                        publisher.next(gameEvent);
                    });

                    observable.subscribe((gameState: GameState) => {
                        expect(gameState.gameStatus).toEqual(GameStatus.X_WIN);
                        expect(gameState.xMoves).toEqual(xCoordinates);

                        expect(gameState.oMoves.length).toEqual(2)
                        expect(gameState.oMoves[0]).toEqual(oCoordinates[0]);
                        expect(gameState.oMoves[1]).toEqual(oCoordinates[1]);
                    });
                });

                it("ignores moves when O_WIN", () => {
                    //		    xox
                    //		    xo-
                    //		    -ox
                    const oCoordinates: Coordinate[] = [
                        { x: 0, y: -1 },
                        { x: 0, y: 0 },
                        { x: 0, y: 1 },
                    ];
                    const xCoordinates: Coordinate[] = [
                        { x: -1, y: -1 },
                        { x: -1, y: 0 },
                        { x: 1, y: -1 },
                    ];
                    const moves: Coordinate[] = weave(xCoordinates, oCoordinates);

                    const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                    const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                    _.forEach(moves, (coordinate: Coordinate) => {
                        const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                        publisher.next(gameEvent);
                    });
                    publisher.next(playerMoveGameEventFactory({ data: { x: 1, y: 1 } }))

                    observable.subscribe((gameState: GameState) => {
                        expect(gameState.gameStatus).toEqual(GameStatus.O_WIN);
                        expect(gameState.xMoves).toEqual(xCoordinates);

                        expect(gameState.oMoves).toEqual(oCoordinates);
                    });
                });
            });

            it("9 moves (with no winner), the game is a DRAW", () => {
                const xCoordinates: Coordinate[] = [
                    { x: -1, y: -1 },
                    { x: 0, y: 0 },
                    { x: 1, y: -1 },
                    { x: 1, y: 0 },
                    { x: 0, y: 1 },
                ]
                const yCoordinates: Coordinate[] = [
                    { x: 0, y: -1 },
                    { x: -1, y: 0 },
                    { x: 1, y: 1 },
                    { x: -1, y: 1 }
                ]

                const interweaved: Coordinate[] = weave(xCoordinates, yCoordinates);
                const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                const statuses: GameStatus[] = [];
                const subscription = observable.subscribe((gameState: GameState) => {
                    statuses.push(gameState.gameStatus);
                });

                _.forEach(interweaved, (coordinate: Coordinate) => {
                    const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                    publisher.next(gameEvent);
                });
                subscription.unsubscribe();

                expect(statuses).toEqual([
                    ..._.times(9, () => GameStatus.PLAYING),
                    GameStatus.DRAW,
                ]);

                observable.subscribe((gameState: GameState) => {
                    expect(gameState.oMoves).toEqual(yCoordinates);

                    expect(gameState.xMoves).toEqual(xCoordinates);

                    expect(gameState.gameStatus).toEqual(GameStatus.DRAW);
                });
            });

            describe("X_WIN", () => {
                describe("at least 3 X moves in a row", () => {
                    const params: Array<{ y: BoardRange; extraX: Coordinate; oCoordinates: Coordinate[] }> = [{
                        y: -1,
                        extraX: { x: 1, y: 0 },
                        oCoordinates: [
                            { x: -1, y: 0 },
                            { x: 1, y: 1 },
                            { x: -1, y: 1 },
                        ]
                    }, {
                        y: 0,
                        extraX: { x: -1, y: 1 },
                        oCoordinates: [
                            { x: -1, y: -1 },
                            { x: 1, y: 1 },
                            { x: 0, y: 1 },
                        ]
                    }, {
                        y: 1,
                        extraX: { x: 1, y: -1 },
                        oCoordinates: [
                            { x: -1, y: -1 },
                            { x: 1, y: 0 },
                            { x: -1, y: 0 },
                        ]
                    }];

                    _.forEach(params, ({ y, extraX, oCoordinates }): void => {
                        it(`for row [${y}] (independent of order), is a x-win`, () => {
                            const rowCoordinates: Coordinate[] = [
                                { x: -1, y },
                                { x: 0, y },
                                { x: 1, y }
                            ];
                            const xCoordinates: Coordinate[] = [extraX, ..._.shuffle(rowCoordinates)];

                            const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                            const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                            const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                            _.forEach(interweaved, (coordinate: Coordinate) => {
                                const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                publisher.next(gameEvent);
                            });

                            observable.subscribe((gameState: GameState) => {
                                expect(gameState.oMoves).toEqual(oCoordinates);

                                expect(gameState.xMoves).toEqual(xCoordinates);

                                expect(gameState.gameStatus).toEqual(GameStatus.X_WIN);
                            });
                        });
                    });
                });
                describe("at least 3 X moves in a column", () => {
                    const params: Array<{ x: BoardRange; extraX: Coordinate; oCoordinates: Coordinate[] }> = [{
                        x: -1,
                        extraX: { x: 0, y: 0 },
                        oCoordinates: [
                            { x: 1, y: 0 },
                            { x: 1, y: 1 },
                            { x: 0, y: 1 },
                        ]
                    }, {
                        x: 0,
                        extraX: { x: -1, y: 1 },
                        oCoordinates: [
                            { x: -1, y: -1 },
                            { x: 1, y: 1 },
                            { x: 1, y: 0 },
                        ]
                    }, {
                        x: 1,
                        extraX: { x: -1, y: 1 },
                        oCoordinates: [
                            { x: -1, y: -1 },
                            { x: 0, y: 0 },
                            { x: -1, y: 0 },
                        ]
                    }];

                    _.forEach(params, ({ x, extraX, oCoordinates }) => {
                        it(`for column [${x}] (independent of order), is a x-win`, () => {
                            const columnCoordinates: Coordinate[] = [
                                { x, y: -1 },
                                { x, y: 0 },
                                { x, y: 1 }
                            ];
                            const xCoordinates: Coordinate[] = [extraX, ..._.shuffle(columnCoordinates)];

                            const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                            const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                            const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                            _.forEach(interweaved, (coordinate: Coordinate) => {
                                const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                publisher.next(gameEvent);
                            });

                            observable.subscribe((gameState: GameState) => {
                                expect(gameState.oMoves).toEqual(oCoordinates);

                                expect(gameState.xMoves).toEqual(xCoordinates);

                                expect(gameState.gameStatus).toEqual(GameStatus.X_WIN);
                            });
                        });
                    });
                });
                describe("diagonals", () => {
                    describe("same x y diagonal", () => {
                        it("is a x-win", () => {
                            const diagonalCoordinates: Coordinate[] = [
                                { x: -1, y: -1 },
                                { x: 0, y: 0 },
                                { x: 1, y: 1 }
                            ];
                            const xCoordinates: Coordinate[] = [
                                { x: 1, y: -1 },
                                ..._.shuffle(diagonalCoordinates)
                            ];
                            const oCoordinates: Coordinate[] = [
                                { x: 1, y: 0 },
                                { x: 0, y: -1 },
                                { x: -1, y: 0 },
                            ];

                            const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                            const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                            const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                            _.forEach(interweaved, (coordinate: Coordinate) => {
                                const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                publisher.next(gameEvent);
                            });

                            observable.subscribe((gameState: GameState) => {
                                expect(gameState.oMoves).toEqual(oCoordinates);

                                expect(gameState.xMoves).toEqual(xCoordinates);

                                expect(gameState.gameStatus).toEqual(GameStatus.X_WIN);
                            });
                        });
                    });
                    describe("opposite x y diagonal", () => {
                        it("is a x-win", () => {
                            // oox
                            // -xo
                            // x-x
                            const diaganolCoordinates: Coordinate[] = [
                                { x: 1, y: -1 },
                                { x: 0, y: 0 },
                                { x: -1, y: 1 }
                            ];
                            const xCoordinates: Coordinate[] = [
                                { x: 1, y: 1 },
                                ..._.shuffle(diaganolCoordinates)
                            ];
                            const oCoordinates: Coordinate[] = [
                                { x: 1, y: 0 },
                                { x: 0, y: -1 },
                                { x: -1, y: 0 },
                            ];

                            const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                            const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                            const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                            _.forEach(interweaved, (coordinate: Coordinate) => {
                                const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                publisher.next(gameEvent);
                            });

                            observable.subscribe((gameState: GameState) => {
                                expect(gameState.oMoves).toEqual(oCoordinates);

                                expect(gameState.xMoves).toEqual(xCoordinates);

                                expect(gameState.gameStatus).toEqual(GameStatus.X_WIN);
                            });
                        });
                    });
                });

                describe("O_WIN", () => {
                    describe("at least 3 O moves in a row", () => {
                        const params: Array<{ y: BoardRange; extra: Coordinate; xCoordinates: Coordinate[] }> = [{
                            y: -1,
                            extra: { x: 1, y: 0 },
                            xCoordinates: [
                                { x: -1, y: 0 },
                                { x: 1, y: 1 },
                                { x: -1, y: 1 },
                                { x: 0, y: 0 },
                            ]
                        }, {
                            y: 0,
                            extra: { x: 1, y: -1 },
                            xCoordinates: [
                                { x: -1, y: -1 },
                                { x: 1, y: 1 },
                                { x: -1, y: 1 },
                                { x: 0, y: -1 },
                            ]
                        }, {
                            y: 1,
                            extra: { x: 1, y: -1 },
                            xCoordinates: [
                                { x: -1, y: -1 },
                                { x: 1, y: 0 },
                                { x: -1, y: 0 },
                                { x: 0, y: -1 },
                            ]
                        }];

                        _.forEach(params, ({ y, extra, xCoordinates }) => {
                            it(`for row [${y}] (independent of order), is an o-win`, () => {
                                const rowCoordinates: Coordinate[] = [
                                    { x: -1, y },
                                    { x: 0, y },
                                    { x: 1, y }
                                ];
                                const oCoordinates: Coordinate[] = [extra, ..._.shuffle(rowCoordinates)];

                                const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                                const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                                const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                                _.forEach(interweaved, (coordinate: Coordinate) => {
                                    const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                    publisher.next(gameEvent);
                                });

                                observable.subscribe((gameState: GameState) => {
                                    expect(gameState.oMoves).toEqual(oCoordinates);

                                    expect(gameState.xMoves).toEqual(xCoordinates);

                                    expect(gameState.gameStatus).toEqual(GameStatus.O_WIN);
                                });
                            });
                        });
                    });
                    describe("at least 3 O moves in a column", () => {
                        const params: Array<{ x: BoardRange; extra: Coordinate; xCoordinates: Coordinate[]; }> = [{
                            x: -1,
                            extra: { x: 0, y: 0 },
                            xCoordinates: [
                                { x: 0, y: -1 },
                                { x: 0, y: 1 },
                                { x: 1, y: 0 },
                                { x: 1, y: 1 },
                            ]
                        }, {
                            x: 0,
                            extra: { x: 1, y: 0 },
                            xCoordinates: [
                                { x: -1, y: -1 },
                                { x: -1, y: 0 },
                                { x: 1, y: -1 },
                                { x: 1, y: 1 },
                            ]
                        }, {
                            x: 1,
                            extra: { x: 0, y: 0 },
                            xCoordinates: [
                                { x: -1, y: -1 },
                                { x: 0, y: -1 },
                                { x: -1, y: 0 },
                                { x: 0, y: 1 },
                            ]
                        }];

                        _.forEach(params, ({ x, extra, xCoordinates }) => {
                            it(`for column [${x}] (independent of order), is an o-win`, () => {
                                const columnCoordinates: Coordinate[] = [
                                    { x, y: -1 },
                                    { x, y: 0 },
                                    { x, y: 1 }
                                ];
                                const oCoordinates: Coordinate[] = [extra, ..._.shuffle(columnCoordinates)];

                                const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                                const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                                const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                                _.forEach(interweaved, (coordinate: Coordinate) => {
                                    const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                    publisher.next(gameEvent);
                                });

                                observable.subscribe((gameState: GameState) => {
                                    expect(gameState.oMoves).toEqual(oCoordinates);

                                    expect(gameState.xMoves).toEqual(xCoordinates);

                                    expect(gameState.gameStatus).toEqual(GameStatus.O_WIN);
                                });
                            });
                        });
                    });
                    describe("diagonals", () => {
                        describe("same x y diagonal", () => {
                            it("is an o-win", () => {
                                const diagonalCoordinates: Coordinate[] = [
                                    { x: -1, y: -1 },
                                    { x: 0, y: 0 },
                                    { x: 1, y: 1 },
                                ];
                                const oCoordinates: Coordinate[] = [
                                    { x: 1, y: -1 },
                                    ..._.shuffle(diagonalCoordinates)
                                ];
                                const xCoordinates: Coordinate[] = [
                                    { x: 0, y: -1 },
                                    { x: -1, y: 0 },
                                    { x: 1, y: 0 },
                                    { x: 0, y: 1 },
                                ];

                                const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                                const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                                const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                                _.forEach(interweaved, (coordinate: Coordinate) => {
                                    const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                    publisher.next(gameEvent);
                                });

                                observable.subscribe((gameState: GameState) => {
                                    expect(gameState.oMoves).toEqual(oCoordinates);

                                    expect(gameState.xMoves).toEqual(xCoordinates);

                                    expect(gameState.gameStatus).toEqual(GameStatus.O_WIN);
                                });
                            });
                        });
                        describe("opposite x y diagonal", () => {
                            it("is an o-win", () => {
                                const diagonalCoordinates: Coordinate[] = [
                                    { x: 1, y: -1 },
                                    { x: 0, y: 0 },
                                    { x: -1, y: 1 }
                                ];
                                const oCoordinates: Coordinate[] = [
                                    { x: 1, y: 1 },
                                    ..._.shuffle(diagonalCoordinates)
                                ];
                                const xCoordinates: Coordinate[] = [
                                    { x: -1, y: -1 },
                                    { x: 0, y: -1 },
                                    { x: -1, y: 0 },
                                    { x: 1, y: 0 },
                                ];

                                const interweaved: Coordinate[] = weave(xCoordinates, oCoordinates);
                                const publisher: Subject<GameEvent> = tickTackToeStateMachine.getPublisher();
                                const observable: Observable<GameState> = tickTackToeStateMachine.getObservable();

                                _.forEach(interweaved, (coordinate: Coordinate) => {
                                    const gameEvent = playerMoveGameEventFactory({ data: coordinate });

                                    publisher.next(gameEvent);
                                });

                                observable.subscribe((gameState: GameState) => {
                                    expect(gameState.oMoves).toEqual(oCoordinates);

                                    expect(gameState.xMoves).toEqual(xCoordinates);

                                    expect(gameState.gameStatus).toEqual(GameStatus.O_WIN);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
