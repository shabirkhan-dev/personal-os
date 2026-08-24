import { Button } from "./button";

export function SaveButton() {
	return <Button onPress={() => alert("Saved!")}>Save changes</Button>;
}
