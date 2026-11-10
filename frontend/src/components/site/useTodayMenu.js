import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export function useTodayMenu() {
  const [state, setState] = useState({ loading: true, today: null, menu: null });
  useEffect(() => {
    api
      .get("/daily-menu/today")
      .then(({ data }) => setState({ loading: false, today: data.today, menu: data.menu }))
      .catch(() => setState({ loading: false, today: null, menu: null }));
  }, []);
  return state;
}
