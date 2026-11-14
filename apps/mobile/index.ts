// Background work must be registered before the app starts, also when the system wakes the app
// just to run it: the reminder tasks and the home-screen widgets' task.
import { installCrashReporting } from "./src/lib/error-report";
import "./src/modules/reminders/services/reminder-tasks";
import { registerWidgets } from "./src/modules/widgets/services/widget-task";
import "expo-router/entry";

installCrashReporting();
registerWidgets();
