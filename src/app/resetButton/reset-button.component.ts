import { Component } from "@angular/core";
import {
    TickTackToeStateMachine,
    EventType,
} from "../tickTackToeGame/tick-tack-toe-state-machine";

@Component({
    selector: "reset-button",
    template: `<button class="reset" (click)=reset()>RESET</button>`,
    styleUrls: ["./reset-button.component.scss"]
})
class ResetButtonComponent {
    constructor(private tickTackToeStateMachine: TickTackToeStateMachine) { }

    reset(): void {
        this.tickTackToeStateMachine.getPublisher().next({ eventType: EventType.RESET });
    }
}

export { ResetButtonComponent };
