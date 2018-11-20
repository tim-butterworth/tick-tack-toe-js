import {
    TestBed,
    async,
    ComponentFixture,
} from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { GameButtonComponent } from "./gameButton/game-button.component";
import { ResetButtonComponent } from "./resetButton/reset-button.component";
import {
    TickTackToeStateMachine,
    GameState,
    GameEvent,
    GameStatus,
    EventType,
} from "./tickTackToeGame/tick-tack-toe-state-machine";
import { playerMoveGameEventFactory } from "./game.event.spec.factory";
import { gameStateFactory } from "./game.state.spec.factory";

import { Subject, Observable } from "rxjs";
import * as R from "ramda";

class FakeTickTackToeState {
    constructor(private subject: Subject<GameEvent>, private observable: Subject<GameState>) { }

    getPublisher(): Subject<GameEvent> {
        return this.subject;
    }

    getObservable(): Observable<GameState> {
        return this.observable;
    }
}

describe("AppComponent", () => {
    let fakeTickTackToeState: FakeTickTackToeState;
    let gameStateSubject: Subject<GameState>;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async(() => {
        const subject: Subject<GameEvent> = new Subject<GameEvent>();
        gameStateSubject = new Subject<GameState>();
        fakeTickTackToeState = new FakeTickTackToeState(subject, gameStateSubject);

        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                GameButtonComponent,
                ResetButtonComponent,
            ],
            providers: [
                { provide: TickTackToeStateMachine, useValue: fakeTickTackToeState }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
    }));

    describe("game buttons", () => {
        it("there are 9 game buttons", () => {
            const nativeElement = fixture.debugElement.nativeElement;

            fixture.detectChanges();

            expect(nativeElement.querySelectorAll(".gameSlot").length).toEqual(9);
        });

        it("each button signals the correct coordinates", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const nativeElement = fixture.debugElement.nativeElement;

            fixture.detectChanges();

            const events: GameEvent[] = [];
            fakeTickTackToeState.getPublisher().asObservable().subscribe((event: GameEvent) => {
                events.push(event);
            });

            const buttons = nativeElement.querySelectorAll(".gameSlot");
            R.forEach((button: any) => button.click(), buttons);

            expect(events).toEqual([
                playerMoveGameEventFactory({ data: { x: -1, y: -1 } }),
                playerMoveGameEventFactory({ data: { x: 0, y: -1 } }),
                playerMoveGameEventFactory({ data: { x: 1, y: -1 } }),

                playerMoveGameEventFactory({ data: { x: -1, y: 0 } }),
                playerMoveGameEventFactory({ data: { x: 0, y: 0 } }),
                playerMoveGameEventFactory({ data: { x: 1, y: 0 } }),

                playerMoveGameEventFactory({ data: { x: -1, y: 1 } }),
                playerMoveGameEventFactory({ data: { x: 0, y: 1 } }),
                playerMoveGameEventFactory({ data: { x: 1, y: 1 } }),
            ]);
        });
    });

    describe("Labels", () => {
        describe("player x won", () => {
            it("displays the winning player but not the turn", () => {
                fixture.detectChanges();

                const nativeElement = fixture.debugElement.nativeElement;

                gameStateSubject.next(gameStateFactory({ gameStatus: GameStatus.X_WIN }));

                fixture.detectChanges();

                const playerTurnLabel = nativeElement.querySelector(".player");
                const gameResultLabel = nativeElement.querySelector(".gameResult");
                expect(playerTurnLabel).toBeFalsy();
                expect(gameResultLabel.textContent).toEqual("X Won");
            });
        });
        describe("player o won", () => {
            it("displays the winning player but not the turn", () => {
                fixture.detectChanges();

                const nativeElement = fixture.debugElement.nativeElement;

                gameStateSubject.next(gameStateFactory({ gameStatus: GameStatus.O_WIN }));

                fixture.detectChanges();

                const playerTurnLabel = nativeElement.querySelector(".player");
                const gameResultLabel = nativeElement.querySelector(".gameResult");
                expect(playerTurnLabel).toBeFalsy();
                expect(gameResultLabel.textContent).toEqual("O Won");
            });
        });
        describe("tie", () => {
            it("displays the winning player but not the turn", () => {
                fixture.detectChanges();

                const nativeElement = fixture.debugElement.nativeElement;

                gameStateSubject.next(gameStateFactory({ gameStatus: GameStatus.DRAW }));

                fixture.detectChanges();

                const playerTurnLabel = nativeElement.querySelector(".player");
                const gameResultLabel = nativeElement.querySelector(".gameResult");
                expect(playerTurnLabel).toBeFalsy();
                expect(gameResultLabel.textContent).toEqual("Tie");
            });
        });
    });

    describe("reset button", () => {
        const assertResetButtonVisible = (
            componentFixture: ComponentFixture<AppComponent>,
            subject: Subject<GameState>,
            tickTackToeState: FakeTickTackToeState,
            gameStatus: GameStatus
        ) => {
            componentFixture.detectChanges();

            subject.next(gameStateFactory({ gameStatus }))

            componentFixture.detectChanges();

            const nativeElement = componentFixture.debugElement.nativeElement;

            const reset = nativeElement.querySelector(".reset");
            expect(reset).toBeTruthy();

            const events: GameEvent[] = [];
            tickTackToeState.getPublisher().asObservable().subscribe((event: GameEvent) => {
                events.push(event);
            });

            reset.click();

            expect(events).toEqual([
                { eventType: EventType.RESET }
            ]);
        };
        it("is not present for gameStatus 'PLAYING'", () => {
            fixture.detectChanges();

            gameStateSubject.next(gameStateFactory({ gameStatus: GameStatus.PLAYING }));

            fixture.detectChanges();

            const nativeElement = fixture.debugElement.nativeElement;

            expect(nativeElement.querySelector(".reset")).toBeFalsy();
        });
        it("appears for gameStatus 'DRAW'", () => {
            assertResetButtonVisible(
                fixture,
                gameStateSubject,
                fakeTickTackToeState,
                GameStatus.DRAW
            );
        });
        it("appears for gameStatus 'X_WIN'", () => {
            assertResetButtonVisible(
                fixture,
                gameStateSubject,
                fakeTickTackToeState,
                GameStatus.X_WIN
            );
        });
        it("appears for gameStatus 'O_WIN'", () => {
            assertResetButtonVisible(
                fixture,
                gameStateSubject,
                fakeTickTackToeState,
                GameStatus.O_WIN
            );
        });
    });
});
