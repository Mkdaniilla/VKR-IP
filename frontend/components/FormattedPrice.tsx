import React from "react";

type Props = {
    value: number;
    currency?: string;
    className?: string;
    locale?: string;
};

export default function FormattedPrice({
    value,
    currency = "RUB",
    className = "",
    locale = "ru-RU"
}: Props) {
    return (
        <span className={className}>
            <span suppressHydrationWarning>
                {value.toLocaleString(locale)}
            </span>
            {" "}{currency}
        </span>
    );
}
