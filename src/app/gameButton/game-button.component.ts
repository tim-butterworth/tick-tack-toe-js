import { Component, Input, OnInit } from '@angular/core';
import { Coordinate } from '../app.component';
import {
    TickTackToeStateMachine,
    GameEvent,
    EventType,
} from "../tickTackToeGame/tick-tack-toe-state-machine";
import { Subject } from "rxjs";

@Component({
    selector: 'game-button',
    templateUrl: './game-button.component.html',
    styleUrls: ['./game-button.component.scss']
})
class GameButtonComponent {

    @Input() coordinate: Coordinate | undefined;
    @Input() value: string = "-";

    clickPublisher: Subject<GameEvent>;

    constructor(tickTackToeMachine: TickTackToeStateMachine) {
        this.clickPublisher = tickTackToeMachine.getPublisher();
    }

    clicked() {
        if (this.coordinate) {
            const event: GameEvent = {
                eventType: EventType.PLAYER_MOVE,
                data: this.coordinate,
            };
            this.clickPublisher.next(event);
        }
    }
}

export { GameButtonComponent };
