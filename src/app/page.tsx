import { Button, Center, Container, Group, PasswordInput } from "@mantine/core";
import { setPasswordCookie } from "./actions";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/main");
  // return (
  //   <Container size="sm">
  //     <Center h="100vh">
  //       <form action={setPasswordCookie}>
  //         <Group align="end">
  //           <PasswordInput name="talia-password" w={300} label="Password" />
  //           <Button type="submit">Enter</Button>
  //         </Group>
  //       </form>
  //     </Center>
  //   </Container>
  // );
}
