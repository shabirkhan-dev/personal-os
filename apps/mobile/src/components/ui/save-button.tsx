import { Button } from "./button";

export function SaveButton() {
	return <Button label="Save changes" variant="primary" onPress={() => alert("Saved!")} />;
}
