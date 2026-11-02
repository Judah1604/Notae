import { Suspense } from "react";
import RoomClient from "./RoomClient";

async function RoomLoader({ params }) {
	const { id } = await params; 
	return <RoomClient room_id={id} />;
}

export default function Page({ params }) {
	return (
		<Suspense fallback={<div>Loading room...</div>}>
			<RoomLoader params={params} />
		</Suspense>
	);
}
