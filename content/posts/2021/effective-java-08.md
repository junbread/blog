---
title: "이펙티브 자바 8장 정리"
date: 2021-08-16
tags: ["Study", "Java"]
---

## 아이템 49: 매개변수가 유효한지 검사하라

메서드나 생성자를 작성할 때에는 매개변수에 어떤 제약이 있을지 생각해야 한다.

- 제약사항을 문서화하고 메서드 시작 부분에 명시적으로 검사하자.
- 유효성 검사를 제대로 하지 않는 경우에는 중간에 모호한 오류가 발생하거나, 잘못된 결과를 반환하거나, 실패 원자성이 깨지는 결과를 낳을 수 있다.
- public과 protected 메서드는 매개변수 값이 잘못됐을 때 던지는 예외를 문서화해야 한다.

```java
/**
 * (현재 값 mod m) 값을 반환한다. 이 메서드는
 * 항상 음이 아닌 BigInteger를 반환한다는 점에서 remainder 메서드와 다르다.
 * 
 * @param m 계수(양수여야 한다.)
 * @return 현재 값 mod m
 * @throws ArithmeticException m이 0보다 작거나 같으면 발생한다.
 */
 public BigInteger mod(BigInteger m) {
     if (m.signum() <= 0)
         throw new ArithmeticException("계수(m)는 양수여야 합니다. " + m);
     ... // 계산 수행
 }
```

자바 7부터는 `Objects.requireNonNull` 메서드 등을 사용하면 null 검사를 편하게 할 수 있다.

```java
this.strategy = Objects.requireNonNull(strategy, "전략");
```

- 나중에 쓰기 위해 저장하는 매개변수는 특히 더 신경써야 한다.

    → 저장 시점에 오류가 발생하지 않기 때문

### 메서드 몸체 실행 전 매개변수 유효성 검사의 예외

- 유효성 검사 비용이 지나치게 높은 경우
- 계산 과정에서 암묵적으로 유효성 검사가 실행되는 경우
    - 메서드 수행 중 API에서 던지기로 한 예외와 다른 예외가 발생하는 경우 API에서 던지기로 한 예외로 번역해주어야 한다.

## 아이템 50: 적시에 방어적 복사본을 만들라

클래스가 클라이언트로부터 받는 매개변수가 가변 객체인 경우 방어적 복사를 통해 클래스 내부를 보호해야 한다.

### 가변 클래스인 java.lang.Date를 매개변수로 받는 Period 클래스

```java
// 코드 50-1 기간을 표현하는 클래스 - 불변식을 지키지 못했다. (302-305쪽)
public final class Period {
    private final Date start;
    private final Date end;

    /**
     * @param  start 시작 시각
     * @param  end 종료 시각. 시작 시각보다 뒤여야 한다.
     * @throws IllegalArgumentException 시작 시각이 종료 시각보다 늦을 때 발생한다.
     * @throws NullPointerException start나 end가 null이면 발생한다.
     */
    public Period(Date start, Date end) {
        if (start.compareTo(end) > 0)
            throw new IllegalArgumentException(
                    start + "가 " + end + "보다 늦다.");
        this.start = start;
        this.end   = end;
    }

    public Date start() {
        return start;
    }
    public Date end() {
        return end;
    }

    public String toString() {
        return start + " - " + end;
    }
}
```

### 가변 매개변수를 이용한 공격

```java
// 코드 50-2 Period 인스턴스의 내부를 공격해보자. (303쪽)
Date start = new Date();
Date end = new Date();
Period p = new Period(start, end);
end.setYear(78);  // p의 내부를 변경했다!
System.out.println(p);
```

이와 같은 공격을 예방하려면 적시에 객체의 방어적 복사본을 만들어야 한다.

→ 이때 `clone` 메서드는 final이 아닌 타입의 경우 재정의할 수 있기 때문에 사용해서는 안 된다.

### 가변 반환값을 이용한 공격

```java
// 코드 50-4 Period 인스턴스를 향한 두 번째 공격 (305쪽)
start = new Date();
end = new Date();
p = new Period(start, end);
p.end().setYear(78);  // p의 내부를 변경했다!
System.out.println(p);
```

이 경우에도 동일하게 가변 필드의 방어적 복사본을 만들어 반환하면 된다.

→ 인스턴스 필드에 있는 객체의 타입은 보장되기 때문에 clone 메서드를 사용해도 관계없다. (하지만 굳이 사용하지는 말자)

## 아이템 51: 메서드 시그니처를 신중히 설계하라

- 메서드 이름을 신중히 짓자.
    - 항상 표준 명명 규칙을 따르고, 같은 패키지의 다른 이름들과 일관되게 짓자.
    - 너무 긴 이름은 피하자.
- 편의 메서드를 너무 많이 만들지 말자.
- 매개변수 목록은 짧게 유지하자.
    - 같은 타입의 매개변수 여러 개가 연달아 나오는 경우가 최악이다.
    - 매개변수 목록이 길 때 사용할 수 있는 방법
        - 여러 메서드로 쪼개기
            - e.g. subList() and indexOf()
        - 매개변수 여러 개를 묶어주는 헬퍼 클래스 만들기
            - e.g. XXXCriteria
        - 빌더 패턴을 메서드 호출에 응용하기
- 매개변수 타입으로는 가능하다면 인터페이스를 사용하자.
- '진짜' boolean이 아닌 이상 boolean보다는 enum이 낫다.

## 아이템 52:  다중정의는 신중히 사용하라

- 재정의한 메서드는 동적으로 선택되고, 다중정의한 메서드는 정적으로 선택된다.
    - 어떤 다중정의한 메서드를 사용할지는 컴파일 타임에 정해진다.

```java
// 코드 52-1 컬렉션 분류기 - 오류! 이 프로그램은 무엇을 출력할까? (312쪽)
public class CollectionClassifier {
    public static String classify(Set<?> s) {
        return "집합";
    }

    public static String classify(List<?> lst) {
        return "리스트";
    }

    public static String classify(Collection<?> c) {
        return "그 외";
    }

    public static void main(String[] args) {
        Collection<?>[] collections = {
                new HashSet<String>(),
                new ArrayList<BigInteger>(),
                new HashMap<String, String>().values()
        };

        for (Collection<?> c : collections)
            System.out.println(classify(c));
    }
}
```

- 다중정의가 혼동을 일으키는 상황을 피해야 한다.
    - 안전하고 보수적으로 가려면 매개변수 수가 같은 다중정의는 만들면 안 된다.
    - 다중정의하는 대신 메서드 이름을 다르게 지어줄 수도 있다.
        - e.g. readBoolean(), readInt(), readLong(), ...
        - 생성자의 경우에는 어쩔 수 없지만 정적 팩터리 메서드를 활용하는 방식도 있다.
    - 메서드 다중정의 시 서로 다른 함수형 인터페이스라도 같은 위치의 인수로 받아서는 안 된다.

## 아이템 53: 가변인수는 신중히 사용하라

가변인수 사용 시 성능 문제에 주의하자.

→ 가변인수 메서드는 호출될 때마다 배열을 생성하기 때문이다.

- 인수가 n개 이상이어야 할 경우, n개까지는 직접 명시하고 이후부터 가변인수를 사용하자.
- 성능에 민감한 상황이라면, 호출 빈도를 고려해 자주 사용되는 인수 개수의 메서드는 다중정의해 놓자.

## 아이템 54: null이 아닌, 빈 컬렉션이나 배열을 반환하라

컬렉션이나 배열을 반환하도록 되어 있는 메서드의 경우 null을 반환하면 사용처에서 추가로 null 체크 로직이 추가되어야 해서 복잡도가 늘어난다.

- 빈 컬렉션이나 배열을 반환하자.
- 성능 문제가 걱정된다면 캐시된 불변 객체를 반환하도록 만들 수도 있다.

## 아이템 55: 옵셔널 반환은 신중히 하라

자바 8부터 제공되는 옵셔널은 명시적으로 반환값이 없을 수도 있다고 선언하는 효과를 준다.

### 옵셔널의 활용방법

- 기본값을 정해둔다. `orElse(XXX)`
    - 기본값 설정비용이 큰 경우 미리 생성하지 않고 supplier 함수를 제공할 수도 있다.
- 원하는 예외를 던진다. `orElseThrow()`
- 항상 값이 채워져 있다고 가정한다. `get()`

### 옵셔널 사용 시 주의사항

- 옵셔널을 반환하도록 선언되어 있는 메서드는 절대 null을 반환해서는 안 된다.
- 컬렉션, 스트림, 배열, 옵셔널 등의 컨테이너 타입은 옵셔널로 감싸면 안 된다.
- 박싱된 기본 타입을 옵셔널로 감싸기보단, 전용 옵셔널 클래스를 사용하자.
- 옵셔널을 컬렉션의 키, 값, 원소로 사용하는 것은 부적절하다.
    - 빈 값을 표현하는 방법이 두 가지가 되기 때문

## 아이템 56: 공개된 API 요소에는 항상 문서화 주석을 작성하라

### 문서화 주석의 원칙

- API를 올바로 문서화하기 위해서는 모든 클래스와 인터페이스, 메서드, 필드 선언에 문서화 주석을 달아야 한다.
- 메서드용 문서화 주석에는 해당 메서드와 클라이언트 사이의 규약을 명료하게 기술해야 한다.
    - how가 아닌 what
    - 호출을 위한 전제조건, 부작용 등

[문서화 주석 태그](https://www.notion.so/48bd0867e9004a5a8fb35a7045a6e481)

### 문서화 주석 작성 주의사항

- 문서화 주석의 요약 설명은 반드시 대상의 기능을 고유하게 기술해야 한다.
    - 한 클래스 안에서 요약 설명이 똑같은 멤버가 둘 이상이면 안 된다.
- 제네릭 타입이나 메서드를 문서화할 때는 모든 타입 매개변수에 주석을 달아야 한다.
- 열거 타입을 문서화할 때는 상수에도 주석을 달아야 한다.
- 애너테이션 타입을 문서화할 때는 멤버들에도 모두 주석을 달아야 한다.
- 클래스 혹은 정적 메서드가 스레드 안전하든 그렇지 않든, 스레드 안전 수준을 API 설명에 포함해야 한다.

javadoc으로 생성된 문서 페이지를 직접 읽어보고 잘 작성된 문서화 페이지인지 점검하자.