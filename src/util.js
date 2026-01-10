import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";

const dataMap = {
  user: "/api/current-user",
  data: "/api/data",
  visits: "/api/visits",
  breastfeeding: "/api/breastfeeding",
  photos: "/api/photos",
  activities: "/api/activities",
};

export function useData(...args) {
  const navigate = useNavigate();
  if (!args.includes("user")) {
    args = [...args, "user"];
  }
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
        navigate("/login");
        return;
      }
      const jsonData = await Promise.all(responses.map(res => res.json()));
      const data = Object.fromEntries(
        args.map((arg, index) => [arg, jsonData[index]])
      );
      setData({ loading: false, data });
    } catch (error) {
      console.error(error);
      navigate("/login");
      return;
    }
  }, [identifier, navigate]);

  const refetch = useCallback(async () => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refetch };
}
