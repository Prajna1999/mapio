import styles from "./page.module.css";
import { Button } from "@/components/ui/button"
export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p>Hello world</p>
        <Button >Click Me </Button>
      </main>

    </div >
  );
}
