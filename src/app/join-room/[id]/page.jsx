import { Suspense } from "react";
import JoinRoomClient from "./JoinRoomClient";

async function JoinRoomLoader({ params }) {
    const { id } = await params; 
    return <JoinRoomClient room_id={id} />;
}

export default function Page({ params }) {
    return (
		<Suspense fallback={<div>Loading room confirmation...</div>}>
			<JoinRoomLoader params={params} />
		</Suspense>
	);
}
