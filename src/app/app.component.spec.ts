import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { GameButtonComponent } from './gameButton/game-button.component';
import { ResetButtonComponent } from "./resetButton/reset-button.component";
import { TickTackToeStateMachine } from "./tickTackToeGame/tick-tack-toe-state-machine";
import * as R from "ramda";

describe('AppComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                GameButtonComponent,
                ResetButtonComponent,
            ],
            providers: [
                TickTackToeStateMachine,
            ]
        }).compileComponents();
    }));

    describe("displays active player", () => {
        it("'X' goes first", () => {
            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges()

            const nativeElement = fixture.debugElement.nativeElement;

            expect(nativeElement.querySelector(".player").textContent).toEqual("X");
        });

        describe("'O' is active after one button click", () => {
            R.forEach((i) => {
                it(`after button [${i + 1}]`, () => {
                    const fixture = TestBed.createComponent(AppComponent);
                    fixture.detectChanges();

                    const nativeElement = fixture.debugElement.nativeElement;
                    const button = nativeElement.querySelectorAll(".gameSlot")[i];

                    button.click();
                    fixture.detectChanges();

                    expect(nativeElement.querySelector(".player").textContent).toEqual("O");
                });
            }, R.range(0, 9));
        });

        describe("'X' is active after two button clicks", () => {
            R.forEach((i) => {
                const indexOne = i;
                const indexTwo = (i + 1) % 9;

                it(`after button [${indexOne + 1}] and [${indexTwo + 1}]`, () => {
                    const fixture = TestBed.createComponent(AppComponent);
                    fixture.detectChanges();

                    const nativeElement = fixture.debugElement.nativeElement;
                    const buttonOne = nativeElement.querySelectorAll('.gameSlot')[indexOne];
                    const buttonTwo = nativeElement.querySelectorAll('.gameSlot')[indexTwo];

                    buttonOne.click();
                    fixture.detectChanges();

                    buttonTwo.click();
                    fixture.detectChanges();

                    expect(nativeElement.querySelector(".player").textContent).toEqual("X");
                });
            }, R.range(0, 9));
        });

        describe("a match", () => {
            it("There can be a tie", () => {
                const fixture = TestBed.createComponent(AppComponent);
                fixture.detectChanges();

                const nativeElement = fixture.debugElement.nativeElement;
                const buttons = nativeElement.querySelectorAll(".gameSlot")

                const indexes: number[] = R.range(-1, 2);

                const buttonKeys: string[] = [];
                R.forEach((x) => {
                    R.forEach((y) => {
                        buttonKeys.push(`[${x}]:[${y}]`);
                    }, indexes)
                }, indexes);

                const buttonMap: { [key: string]: any } = R.reduce(
                    (accume, v) => {
                        Object.assign(accume, { [v[0]]: v[1] });
                        return accume;
                    },
                    {},
                    R.zip(buttonKeys, buttons)
                )

                buttonMap["[0]:[0]"].click(); // X
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[-1]:[-1]"].click(); // O
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[-1]:[1]"].click(); // X
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[1]:[-1]"].click(); // O
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[0]:[-1]"].click(); // X
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[0]:[1]"].click(); // O
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[-1]:[0]"].click(); // X
                fixture.detectChanges()
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[1]:[0]"].click(); // O
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult")).toBeFalsy();

                buttonMap["[1]:[1]"].click(); // X
                fixture.detectChanges();
                expect(nativeElement.querySelector(".gameResult").textContent).toEqual("Tie");
            });
        });
    });
});
