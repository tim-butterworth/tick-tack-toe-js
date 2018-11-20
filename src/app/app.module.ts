import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { GameButtonComponent } from "./gameButton/game-button.component";
import { ResetButtonComponent } from "./resetButton/reset-button.component";
import { TickTackToeStateMachine } from "./tickTackToeGame/tick-tack-toe-state-machine";

@NgModule({
    declarations: [
        AppComponent,
        GameButtonComponent,
        ResetButtonComponent,
    ],
    imports: [
        BrowserModule
    ],
    providers: [
        TickTackToeStateMachine
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
