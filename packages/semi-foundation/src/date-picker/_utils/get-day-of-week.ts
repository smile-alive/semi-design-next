type WeekStartNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export default function getDayofWeek({ weekStartsOn = 0 }: { weekStartsOn: WeekStartNumber }) {
    const weekDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return [...weekDay.slice(weekStartsOn), ...weekDay.slice(0, weekStartsOn)];
}
