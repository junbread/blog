---
title: "이펙티브 자바 11장 정리"
date: 2021-08-16
slug: "/effective-java-11"
tags: ["Study", "Java"]
---

## 아이템 78: 공유 중인 가변 데이터는 동기화해 사용하라

여러 스레드가 하나의 가변 데이터를 사용할 때에 입출력 시 동기화에 신경쓰지 않는다면 잘못된 동작을 유발할 수 있다.

```java
// 코드 78-1 잘못된 코드 - 이 프로그램은 얼마나 오래 실행될까? (415쪽)
public class StopThread {
    private static boolean stopRequested;

    public static void main(String[] args)
            throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested)
                i++;
        });
        backgroundThread.start();

        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

- 여러 스레드가 공유하는 가변 데이터를 동기화하지 않을 경우 다른 스레드에서 변경한 값을 언제 보게 될 지 알 수 없다.
- 컴파일러 최적화 수행 결과 의도하지 않은 대로 동작할 수도 있다.

### 멀티 스레드 환경에서 가변 공유 데이터를 다루는 방법

- 멀티스레드에서 가변 데이터를 공유하지 말자. (최선)

→ `synchronized` 를 사용해 동기화하자.

동기화 시에는 **읽기와 쓰기 모두**를 동기화해야 한다.

```java
private static boolean stopRequested;

    private static synchronized void requestStop() {
        stopRequested = true;
    }

    private static synchronized boolean stopRequested() {
        return stopRequested;
    }
```

→ `volatile` 을 사용하면 항상 가장 최근에 기록된 값을 읽도록 보증한다. (메모리 접근)

```java
private static volatile boolean stopRequested;
```

- 하지만 원자적이지 않은 연산 수행 시에는 동기화해야 하며, 하지 않을 경우 **안전 실패**가 발생할 가능성이 있다.

→ java.util.concurrent에서 제공하는 Atomic* 자료구조를 사용하면, 동기화 락 없이도 스레드 안전하게 구현이 가능하다.

## 아이템 79: 과도한 동기화는 피하라

너무 과한 동기화는 성능을 떨어뜨리고 데드락을 유발하거나, 안전 실패의 원인이 된다.

- 응답 불가나 안전 실패를 피하려면 동기화 메서드나 동기화 블럭 안에서는 제어를 클라이언트에 양도해서는 안된다.
    - 외계인(?) 메서드

        ```java
        // 코드 79-1 잘못된 코드. 동기화 블록 안에서 외계인 메서드를 호출한다. (420쪽)
        private final List<SetObserver<E>> observers
                = new ArrayList<>();

        public void addObserver(SetObserver<E> observer) {
            synchronized(observers) {
                observers.add(observer);
            }
        }

        public boolean removeObserver(SetObserver<E> observer) {
            synchronized(observers) {
                return observers.remove(observer);
            }
        }

        private void notifyElementAdded(E element) {
            synchronized(observers) {
                for (SetObserver<E> observer : observers)
                    observer.added(this, element);
            }
        }

        ...

        public class Test2 {
            public static void main(String[] args) {
                ObservableSet<Integer> set =
                        new ObservableSet<>(new HashSet<>());

                set.addObserver(new SetObserver<>() {
                    public void added(ObservableSet<Integer> s, Integer e) {
                        System.out.println(e);
                        if (e == 23) // 값이 23이면 자신을 구독해지한다.
                            s.removeObserver(this);
                    }
                });

                for (int i = 0; i < 100; i++)
                    set.add(i);
            }
        }
        ```

        테스트 실행 시 ConcurrentModificationException 발생!

        → 동기화 블럭 안에서 클라이언트 메서드가 호출되었기 때문에 synchronized의 보호를 받지 못한다.

        ```java
        // 코드 79-3 외계인 메서드를 동기화 블록 바깥으로 옮겼다. - 열린 호출 (424쪽)
        private void notifyElementAdded(E element) {
            List<SetObserver<E>> snapshot = null;
            synchronized(observers) {
                snapshot = new ArrayList<>(observers);
            }
            for (SetObserver<E> observer : snapshot)
                observer.added(this, element);
        }
        ```

        ```java
        // 코드 79-4 CopyOnWriteArrayList를 사용해 구현한 스레드 안전하고 관찰 가능한 집합 (425쪽)
            private final List<SetObserver<E>> observers =
                    new CopyOnWriteArrayList<>();

            public void addObserver(SetObserver<E> observer) {
                observers.add(observer);
            }

            public boolean removeObserver(SetObserver<E> observer) {
                return observers.remove(observer);
            }

            private void notifyElementAdded(E element) {
                for (SetObserver<E> observer : observers)
                    observer.added(this, element);
            }

            @Override public boolean add(E element) {
                boolean added = super.add(element);
                if (added)
                    notifyElementAdded(element);
                return added;
            }

            @Override public boolean addAll(Collection<? extends E> c) {
                boolean result = false;
                for (E element : c)
                    result |= add(element);  // notifyElementAdded를 호출한다.
                return result;
            }
        ```

- 동기화 영역은 최대한 작게 가져가자.
- 합당한 이유가 있을 때만 내부에서 동기화하고, 동기화 여부를 문서에 명확히 밝히자.

## 아이템 80: 스레드보다는 실행자, 태스크, 스트림을 애용하라

작업 큐를 만들기 위해 스레드를 직접 다루기보다는 java.util.concurrent 하위의 실행자 프레임워크를 이용하자.

```java
ExecutorService exec = Executors.newSingleThreadExecutor();
exec.execute(runnable);
exec.shutdown();
```

### 실행자 프레임워크의 기능

- 특정 태스크 완료 대기
- 태스크 모음 중 아무거나 하나, 혹은 모든 태스크 완료 대기
- 실행자 서비스 종료 대기
- 완료된 태스크의 결과를 차례로 받기
- 태스크를 특정 시간, 혹은 주기로 실행하기

프로그램 규모에 따라 각각 다른 스레드 관리 메커니즘을 사용하는 실행자 서비스를 생성할 수 있다.

ex) Executors.newCachedThreadPool, Executors.newFixedThreadPool, ...

자바 7부터는 ForkJoinPool을 지원하도록 개량되어서 효율성이 개선되었다.

## 아이템 81: wait과 notify보다는 동시성 유틸리티를 애용하라

wait과 notify는 올바르게 사용하기 매우 어려우므로, 고수준 동시성 유틸리티를 사용하는 것이 좋다.

### 고수준 동시성 유틸리티의 종류

- 실행자 프레임워크
- 동시성 컬렉션
    - ConcurrentHashMap 등 내부에서 동기화를 효율적으로 구현한 컬렉션
    - 상태 의존적 메서드들이 추가되어 있음 ex) putIfAbsent
- 동기화 장치
    - CountDownLatch, Semaphore, ...

```java
// 코드 81-3 동시 실행 시간을 재는 간단한 프레임워크 (433-434쪽)
public class ConcurrentTimer {
    private ConcurrentTimer() { } // 인스턴스 생성 불가

    public static long time(Executor executor, int concurrency,
                            Runnable action) throws InterruptedException {
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done  = new CountDownLatch(concurrency);

        for (int i = 0; i < concurrency; i++) {
            executor.execute(() -> {
                ready.countDown(); // 타이머에게 준비를 마쳤음을 알린다.
                try {
                    start.await(); // 모든 작업자 스레드가 준비될 때까지 기다린다.
                    action.run();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();  // 타이머에게 작업을 마쳤음을 알린다.
                }
            });
        }

        ready.await();     // 모든 작업자가 준비될 때까지 기다린다.
        long startNanos = System.nanoTime();
        start.countDown(); // 작업자들을 깨운다.
        done.await();      // 모든 작업자가 일을 끝마치기를 기다린다.
        return System.nanoTime() - startNanos;
    }
}
```

어쩔 수 없이 wait/notify를 사용해야 할 때에는 wait 호출 시 while 문 안에서만 호출하는 표준 방식을 따르자.

```java
synchronized (obj) {
    while (<조건이 충족되지 않았다>)
        obj.wait(); // (락을 놓고, 깨어나면 다시 잡는다.)
    ... // 조건이 충족됐을 때의 동작을 수행한다.
}
```

## 아이템 82: 스레드 안전성 수준을 문서화하라

멀티스레드 환경에서 API를 안전하게 사용하려면 클래스가 지원하는 스레드 안전성 수준을 명시해야 한다.\

### 스레드 안전성 수준

- 불변
- 무조건적 스레드 안전: 수정될 수 있으나 내부에서 동기화해서 별도의 처리 없이 스레드 안전하게 사용 가능하다.
- 조건부 스레드 안전: 일부 스레드를 사용하려면 외부 동기화가 필요하다.
- 스레드 안전하지 않음:  동시에 사용하기 위해서는 외부 동기화가 필요하다.
- 스레드 적대적: 외부 동기화로 감싸더라도 멀티스레드 환경에서 안전하지 않다. (정적 데이터를 동기화 없이 수정하는 경우)

조건부 스레드 안전한 클래스는 주의해서 어떤 순서로 호출할 때 동기화 로직이 필요한지, 어떤 락을 얻어야 하는지 기술해야 한다.

공개된 락을 사용하는 경우 클라이언트에서 락을 풀지 않는 서비스 거부 공격을 할 수 있기 때문에, 비공개 락 객체를 사용하고 final로 선언하는 것이 좋다.

## 아이템 83: 지연 초기화는 신중히 사용하라

상황에 따라 지연 초기화는 오히려 성능을 더 느리게 만들 수 있으므로 신중히 사용해야 한다.

대부분의 상황에서는 일반적인 초기화가 좋다.

### 멀티스레드 환경에서의 지연 초기화

- 지연 초기화가 초기화 순환성을 깨뜨릴 것 같으면 synchronized를 단 접근자를 사용하자.

    ```java
    // 코드 83-2 인스턴스 필드의 지연 초기화 - synchronized 접근자 방식 (443쪽)
        private FieldType field2;
        private synchronized FieldType getField2() {
            if (field2 == null)
                field2 = computeFieldValue();
            return field2;
        }
    ```

- 성능 때문에 정적 필드를 지연 초기화해야 한다면 지연 초기화 홀더 클래스 관용구를 사용하자.

    ```java
    // 코드 83-3 정적 필드용 지연 초기화 홀더 클래스 관용구 (443쪽)
        private static class FieldHolder {
            static final FieldType field = computeFieldValue();
        }
        private static FieldType getField() { return FieldHolder.field; }
    ```

- 성능 때문에 인스턴스 필드를 지연 초기화해야 한다면 이중 검사 관용구를 사용하자.

    → 이미 초기화된 경우 synchronized 블럭에 진입하지 않아서 접근 비용이 작아진다.

    ```java
    // 코드 83-4 인스턴스 필드 지연 초기화용 이중검사 관용구 (444쪽)
        private volatile FieldType field4;

        private FieldType getField4() {
            FieldType result = field4;
            if (result != null)    // 첫 번째 검사 (락 사용 안 함)
                return result;

            synchronized(this) {
                if (field4 == null) // 두 번째 검사 (락 사용)
                    field4 = computeFieldValue();
                return field4;
            }
        }
    ```

- 반복해서 초기화해도 상관없는 경우 동기화 없이 단일 검사해도 괜찮다.

## 아이템 84: 프로그램의 동작을 스레드 스케줄러에 기대지 말라

스레드 스케줄러의 동작은 플랫폼, 운영체제마다 다르기 때문에 다른 플랫폼에 이식하기 어려워질 수 있다.

- 실행 가능한 스레드의 수가 프로세스의 수보다 과도하게 많아서는 안 된다.
- 스레드는 당장 처리해야 할 작업이 없다면 실행되어서는 안 된다.
- 스레드는 절대 바쁜 대기 상태가 되어서는 안 된다.

    ```java
    // 코드 84-1 끔찍한 CountDownLatch 구현 - 바쁜 대기 버전! (447쪽)
    public class SlowCountDownLatch {
        private int count;

        public SlowCountDownLatch(int count) {
            if (count < 0)
                throw new IllegalArgumentException(count + " < 0");
            this.count = count;
        }

        public void await() {
            while (true) {
                synchronized(this) {
                    if (count == 0)
                        return;
                }
            }
        }
        public synchronized void countDown() {
            if (count != 0)
                count--;
        }
    ```

    → 이 문제를 고친답시고 Thread.yield 등을 사용한다면 JVM 구현체별로 다른 효과에 이식성만 나빠지는 결과를 초래할 수 있다.