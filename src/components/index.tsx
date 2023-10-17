import { ParentComponent } from "solid-js"

export const VStack: ParentComponent = (props) => {
    return (
        <div class="flex flex-col gap-2">
            {props.children}
        </div>
    )
}

export const Header = (props: { children: string }) => {
    return (
        <h2 class="text-xl font-semibold">{props.children}</h2>
    )
}