import { useEffect, useState, useCallback } from "react";

const dataMap = {
  user: "/api/current-user",
  data: "/api/data",
  visits: "/api/visits",
  breastfeeding: "/api/breastfeeding",
  photos: "/api/photos",
};

export function useData(...args) {
  const identifier = args.join("-");
  const [data, setData] = useState({ loading: true, data: {} });

  const fetchData = useCallback(async () => {
    const args = identifier.split("-");
    const endpoints = args.map(arg => dataMap[arg]);
    if (endpoints.includes(undefined)) {
      throw new Error("Invalid data key");
    }
    try {
      const responses = await Promise.all(
        endpoints.map(endpoint => fetch(endpoint))
      );
      if (responses.some(res => !res.ok)) {
        window.location.href = "/login";
      }
      const jsonData = await Promise.all(responses.map(res => res.json()));
      const data = Object.fromEntries(
        args.map((arg, index) => [arg, jsonData[index]])
      );
      setData({ loading: false, data });
    } catch (error) {
      console.error(error);
      window.location.href = "/login";
    }
  }, [identifier]);

  const refetch = useCallback(async () => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refetch };
}
