import {Formattable} from "./Formattable"

export class EventParticipant implements Formattable {
	name: string
	email: string

	constructor(name: string, email: string) {
		this.name = name
		this.email = email
	}

	formatResponse(): any {
		return {email: this.email}
	}
}
