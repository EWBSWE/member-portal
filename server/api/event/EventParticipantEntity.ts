export type EventParticipantEntity = MemberEntity & {
	event_id: number
	member_id: number
}

// TODO(dan) 27/01/19: this is incomplete
type MemberEntity = {
	name: string
	email: string
}

