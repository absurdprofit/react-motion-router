export class History {
    push(route: string) {
        window.history.pushState({}, "", route);
    }

    back() {
        window.history.back();
    }
}
export class Navigation {
    private history = new History();
    navigate(route: string, route_params?: any) {
        this.history.push(route);

        const event = new CustomEvent('navigate', {
            detail: {
                route: route,
                route_params: route_params
            }
        });

        window.dispatchEvent(event);
    }

    go_back() {
        this.history.back();

        const event = new CustomEvent('go-back');

        window.dispatchEvent(event);  
    }
}