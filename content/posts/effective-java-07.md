---
title: "이펙티브 자바 7장 정리"
date: 2021-05-22
slug: "/effective-java-07"
tags: ["Study", "Java"]
---

## 아이템 42: 익명 클래스보다는 람다를 사용하라

예전에는 함수 타입을 표현할 때 추상 메서드가 하나만 있는 인터페이스를 익명 클래스로 구현하는 방식을 사용했다.

```java
Collections.sort(words, new Comparator<String>() {
        public int compare(String s1, String s2) {
            return Integer.compare(s1.length(), s2.length());
        }
    });
```

람다가 도입되면서 간결한 방식으로 함수 객체를 표현할 수 있게 되었다.

```java
Collections.sort(words, (s1, s2) -> Integer.compare(s1.length(), s2.length()));
```

```java
// 코드 42-4 함수 객체(람다)를 인스턴스 필드에 저장해 상수별 동작을 구현한 열거 타입 (256-257쪽)
public enum Operation {
    PLUS  ("+", (x, y) -> x + y),
    MINUS ("-", (x, y) -> x - y),
    TIMES ("*", (x, y) -> x * y),
    DIVIDE("/", (x, y) -> x / y);

    private final String symbol;
    private final DoubleBinaryOperator op;

    Operation(String symbol, DoubleBinaryOperator op) {
        this.symbol = symbol;
        this.op = op;
    }

    @Override public String toString() { return symbol; }

    public double apply(double x, double y) {
        return op.applyAsDouble(x, y);
    }
}
```

### 람다 사용시의 주의점

- 타입을 명시해야 코드가 더 명확해질 때를 제외하고는 람다의 모든 매개변수 타입을 생략하자.
- 람다는 이름이 없고 문서화도 못 하기 때문에, 코드 자체로 명확히 설명되지 않거나 코드 줄 수가 많아지면 사용을 삼가자.
- 구현체별로 직렬화 방식이 다를 수 있기 때문에, 람다를 직렬화해서는 안 된다.

### 람다를 사용할 수 없는 경우

- 추상 클래스의 인스턴스를 만드는 경우
- 추상 메서드가 여러 개인 인터페이스의 인스턴스를 만드는 경우
- this가 자기 자신을 가리켜야 하는 경우

## 아이템 43: 람다보다는 메소드 참조를 사용하라

메소드 참조를 사용하면 람다보다도 간결한 코드를 작성할 수 있다.

```java
frequencyTable.merge(s, 1, (count, incr) -> count + incr); // 람다
frequencyTable.merge(s, 1, Integer::sum); // 메서드 참조
```

람다가 메서드 참조보다 더 간결한 경우도 있다. e.g. 람다와 메서드가 같은 클래스 내에 있을 경우

### 메서드 참조 유형

- 정적
    - `str -> Integer.parseInt(str)` ⇒ `Integer::parseInt`
- 한정적 (인스턴스)

    ```java
    Instant then = Instant.now();
    t -> then.isAfter(t);

    Instant.now()::isAfter
    ```

- 비한정적 (인스턴스)
    - `str -> str.toLowerCase()` ⇒ `String::toLowerCase`
- 클래스 생성자
    - `() -> new TreeMap<K, V>()` ⇒ `TreeMap<K,V>::new`
- 배열 생성자
    - `len -> new int[len]` ⇒ `int[]::new`

## 아이템 44: 표준 함수형 인터페이스를 사용하라

자바에서는 람다에 사용할 수 있도록 다양한 모양의 표준 함수형 인터페이스를 제공하고 있다.

- 람다에 사용하기 위해 직접 인터페이스를 구현하기보다는, 표준 함수형 인터페이스를 사용하자.

### 전용 함수형 인터페이스를 구현해야 하는 경우

e.g. Comparator

- 자주 쓰이며, 이름 자체가 용도를 명확히 설명한다.
- 반드시 따라야 하는 규약이 있다.
- 유용한 디폴트 메서드를 제공할 수 있다.

직접 만든 함수형 인터페이스에는 항상 @FunctionalInterface 애너테이션을 사용하자.

## 아이템 45: 스트림은 주의해서 사용하라

자바 8에서 추가된 스트림은 다량의 데이터 처리 작업을 위해 도입되었다.

### 스트림 파이프라인

- 스트림 파이프라인은 지연 평가된다.
- 평가는 종단 연산이 호출될 때 이루어지며, 종단 연산에 쓰이지 않는 데이터 원소는 계산에 쓰이지 않는다.

스트림을 잘못 사용하면 읽기 어렵고 유지보수가 힘든 코드가 만들어진다.

```java
// 코드 45-2 스트림을 과하게 사용했다. - 따라 하지 말 것! (270-271쪽)
public class StreamAnagrams {
    public static void main(String[] args) throws IOException {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(
                    groupingBy(word -> word.chars().sorted()
                            .collect(StringBuilder::new,
                                    (sb, c) -> sb.append((char) c),
                                    StringBuilder::append).toString()))
                    .values().stream()
                    .filter(group -> group.size() >= minGroupSize)
                    .map(group -> group.size() + ": " + group)
                    .forEach(System.out::println);
        }
    }
}
```

→ 도우미 메서드를 적절히 활용하자.

```java
// 코드 45-3 스트림을 적절히 활용하면 깔끔하고 명료해진다. (271쪽)
public class HybridAnagrams {
    public static void main(String[] args) throws IOException {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(groupingBy(word -> alphabetize(word)))
                    .values().stream()
                    .filter(group -> group.size() >= minGroupSize)
                    .forEach(g -> System.out.println(g.size() + ": " + g));
        }
    }

    private static String alphabetize(String s) {
        char[] a = s.toCharArray();
        Arrays.sort(a);
        return new String(a);
    }
}
```

### 스트림과 람다

- 람다에서는 타입을 자주 생략하므로 매개변수 이름을 잘 지어야 한다.
- 도우미 메서드를 적절히 활용하는 일의 중요성은 일반 반복 코드보다는 스트림 파이프라인에서 훨씬 크다.

### 스트림을 쓰면 좋은 것

- 원소들의 시퀀스를 일관되게 변환한다.
- 원소들의 시퀀스를 필터링한다.
- 원소들의 시퀀스를 하나의 연산을 사용해 결합한다.
- 원소들의 시퀀스를 컬렉션에 모은다.
- 원소들의 시퀀스에서 특정 조건을 만족하는 원소를 찾는다.

### 스트림(+람다)이 할 수 없는 것

- 람다에선 final 이거나 사실상 final인 변수만 읽을 수 있고, 지역변수를 수정할 수 없다.
- 람다는 흐름 제어가 불가능하지만, 코드 블록에서는 가능하다.

> 스트림과 반복문 중 어떤 쪽이 나은지 확신하기 어렵다면 직접 구현해 보고 나은 쪽을 선택하자.

## 아이템 46: 스트림에서는 부작용없는 함수를 사용하라

- 함수형 패러다임을 지키려면 부작용없는 순수함수를 사용해야 한다.
- 순수함수는 입력만이 결과에 영향을 주는 함수이며, 함수 외부의 가변 상태를 참조하지 않고 외부의 상태도 변경하지 않는 함수이다.
- 스트림 파이프라인에 사용할 함수는 부작용이 없는 순수 함수를 사용해야 한다.
    - forEach 연산은 스트림 계산 결과를 보고할 때만 사용하고, 계산하는 데는 쓰지 말자.
    - 잘못된 예

    ```java
    // 코드 46-1 스트림 패러다임을 이해하지 못한 채 API만 사용했다 - 따라 하지 말 것! (277쪽)
    Map<String, Long> freq = new HashMap<>();
    try (Stream<String> words = new Scanner(file).tokens()) {
        words.forEach(word -> {
            freq.merge(word.toLowerCase(), 1L, Long::sum);
        });
    }
    ```

    - 좋은 예

    ```java
    // 코드 46-2 스트림을 제대로 활용해 빈도표를 초기화한다. (278쪽)
    Map<String, Long> freq;
    try (Stream<String> words = new Scanner(file).tokens()) {
        freq = words
                .collect(groupingBy(String::toLowerCase, counting()));
    }
    ```

- 수집기를 사용하면 스트림의 원소를 손쉽게 컬렉션으로 모을 수 있다.
    - toList(), toSet(), toMap() ...

## 아이템 47: 반환 타입으로는 스트림보다 컬렉션이 낫다

스트림은 반복을 지원하지 않는다. Iterable을 사용해 우회할 수 있으나, 코드가 지저분해지고 읽기 힘들어진다.

- 어댑터를 사용해서 Iterable ↔ Stream간 상호 변환을 간단히 구현할 수 있다.

```java
// 스트림 <-> 반복자 어댑터 (285-286쪽)
public class Adapters {
    // 코드 47-3 Stream<E>를 Iterable<E>로 중개해주는 어댑터 (285쪽)
    public static <E> Iterable<E> iterableOf(Stream<E> stream) {
        return stream::iterator;
    }

    // 코드 47-4 Iterable<E>를 Stream<E>로 중개해주는 어댑터 (286쪽)
    public static <E> Stream<E> streamOf(Iterable<E> iterable) {
        return StreamSupport.stream(iterable.spliterator(), false);
    }
}
```

- 원소 시퀀스를 반환하는 공개 API의 반환 타입에는 Collection이나 하위 타입을 사용하는 것이 일반적으로 최선이다.
- 원소를 이미 컬렉션에 담아 관리하고 있거나 원소 개수가 적다면 표준 컬렉션에 담아서 반환하고, 그렇지 않다면 전용 컬렉션을 구현하는 것을 검토하자.

→ 반환 타입은 스트림보다는, 반복과 스트림을 모두 지원할 수 있는 컬렉션 타입이 낫다.

## 아이템 48: 스트림 병렬화는 주의해서 적용하라

스트림은 `.parallel()` 로 쉽게 병렬화할 수 있지만, 마구잡이로 사용할 경우 오히려 성능을 해치거나, 잘못된 결과를 만들 수 있다.

- 데이터 소스가 `Stream.iterate`거나 중간 연산으로 limit를 쓰면 파이프라인 병렬화로는 성능 개선을 기대할 수 없다.
- 대체로 스트림의 소스가 ArrayList, HashMap, HashSet, ConcurrentHashMap의 인스턴스거나, 배열, IntRange, LongRange일 때 병렬화의 효과가 가장 좋다.
    - 데이터를 원하는 크기로 정확하고 손쉽게 나눌 수 있고, 참조 지역성이 뛰어나기 때문
- 파이프라인이 수행하는 작업이 병렬화에 드는 추가 비용을 상쇄하지 못한다면 성능 향상에는 도움이 되지 않는다.