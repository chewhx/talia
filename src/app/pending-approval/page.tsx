"use client";
import { Container } from "@mantine/core";
import { useEffect } from "react";

export default function PendingApproval() {
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await fetch("/api/approval");
        const data = await result.json();

        console.log({ data });
      } catch (error) {
        console.log({ error });
      }
    };

    fetchUsers();
  }, []);

  return (
    <Container size={420} my={40}>
      Users
    </Container>
  );
}
