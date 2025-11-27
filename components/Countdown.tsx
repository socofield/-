import React from 'react';

interface CountdownProps {
  targetDate: Date;
  urgencyColor: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, urgencyColor }) => {
  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +targetDate - +new Date();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-4 w-20 sm:w-24 border border-white/20 shadow-xl">
      <span className={`text-2xl sm:text-4xl font-black ${urgencyColor} tabular-nums`}>
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-xs sm:text-sm text-gray-300 uppercase tracking-wider mt-1 font-semibold">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex gap-2 sm:gap-4 justify-center">
      <TimeBlock value={timeLeft.days} label="Days" />
      <TimeBlock value={timeLeft.hours} label="Hrs" />
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </div>
  );
};

export default Countdown;