---
title: "이펙티브 자바 9장 정리"
date: 2021-08-16
tags: ["Study", "Java"]
---

## 아이템 57: 지역변수의 범위를 최소화하라

자바는 문장을 선언할 수 있는 곳이면 어디든 변수를 선언할 수 있기 때문에 가장 처음 쓰일 때 선언하는 것이 좋으며, 스코프가 오염되는 것을 방지할 수 있다.

### 지역변수 초기화 시점

- 거의 모든 지역변수는 선언과 동시에 초기화해야 한다.
- 예외적으로 try-catch를 사용할 때는 try 블록 안에서 초기화해야 한다.

### 반복문은 while 문보다는 for 문을 사용하자

→ while 문을 사용할 때는 반복문 블록 밖에 불필요한 변수가 존재하기 때문에 잠재적인 오류 가능성이 있다.

```java
Iterator<Element> i = c.iterator();
while (i.hasNext()) {
    doSomething(i.next());
}
```

```java
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
	  doSomething(e);
}
```

## 아이템 58: 전통적인 for 문보다는 for-each 문을 사용하라

자바 1.5부터 추가된 for-each 문은 전통적인 for 문보다 깔끔하고 예상치 못한 오류를 줄여 준다.

Iterable을 구현한 객체라면 무엇이든 순회 가능하다.

```java
var list = new ArrayList<Integer>();
for (int i = 0; i < list.size(); i++) {
}

for (var item : list) {
}
```

### for-each를 사용할 수 없는 상황

- 파괴적인 필터링: 컬렉션을 순회하면서 특정 원소를 제거

    자바 8부터는 `Collections.removeIf()`를 사용할 수 있다.

- 변형: 컬렉션을 순회하면서 원소의 값 또는 전체를 교체
- 병렬 반복: 컬렉션을 병렬로 순회

## 아이템 59: 라이브러리를 익히고 사용하라

표준 라이브러리를 사용하면 코드를 작성한 전문가의 지식과 다른 프로그래머의 경험을 활용할 수 있다.

→ 바퀴를 재발명하지 말자.

## 아이템 60: 정확한 답이 필요하다면 float와 double은 피하라

float과 double 등의 부동 소수점 연산 타입은 정확한 값이 아닌 **근사치**를 사용하기 때문에, 정확한 값이 필요할 때는 사용하면 안 된다.

→ 느리지만 정확한 값이 필요하다면 BigInteger, BigDecimal 타입을 사용하자.

## 아이템 61: 박싱된 기본 타입보다는 기본 타입을 사용하라

오토박싱이 지원되기 때문에 기본 타입과 참조 타입을 큰 구분없이 사용할 수 있지만, 사용에 주의해야 한다.

### 기본 타입과 박싱된 기본 타입의 차이점

- 기본 타입은 값만 가지고 있지만, 박싱된 기본 타입은 참조 타입이기 때문에 참조 식별성이 있다.

    ```java
    var a = new Integer(1);
    var b = new Integer(1);

    a.equals(b); // true
    a == b; // false
    ```

- 박싱된 기본 타입은 null을 가질 수 있다.
- 기본 타입이 박싱된 타입보다 효율적이다.
    - 박싱 타입은 참조 타입이기 때문에 무조건 메모리를 사용하지만, 기본 타입은 변수 자체에 값이 있다.

### 박싱된 타입 사용시 발생할 수 있는 상황들

- 박싱된 타입에서 동등성 비교를 `equals()` 대신 `==`를 사용해서 하게 되면 정상적으로 동작하지 않는다.
- 기본 타입과 박싱된 타입을 혼용한 연산에서는 대부분 언박싱되므로, NPE에 주의해야 한다.

    ```java
    public class Unbelievable {
        static Integer i;

        public static void main(String[] args) {
            if (i == 42) {
                System.out.println("믿을 수 없군");
            }
        }
    }
    ```

- 타입을 잘못 사용하게 되면 오토박싱으로 인한 성능 저하가 일어난다.

    ```java
    public static void main(String[] args) {
        Long sum = 0L;
        for (long i = 0L; i < Integer.MAX_VALUE; i++) {
            sum += i;
        }
        System.out.println(sum);
    }
    ```

매개변수화 타입의 타입 매개변수로 사용할 때, 리플렉션을 사용할 때를 제외하고는 기본 타입을 사용하는 것이 낫다.

## 아이템 62: 다른 타입이 적절하다면 문자열 사용을 피하라

더 적절한 타입이 있거나 새로 작성할 수 있다면 문자열을 사용하지 말고 해당 타입을 사용하자.

다른 값 타입/열거 타입/혼합 타입을 표현하기 위해 문자열을 사용하지 말아야 한다.

## 아이템 63: 문자열 연결은 느리니 주의하라

문자열은 불변이기 때문에, 두 문자열을 연결할 경우 양쪽의 내용을 모두 복사해야 한다.

→ 많은 문자열을 연결할 때는 문자열 연결 연산자(+) 대신 StringBuilder를 사용하자.

## 아이템 64: 객체는 인터페이스를 사용해 참조하라

인터페이스를 참조하면 프로그램이 훨씬 유연해진다.

- 적합한 인터페이스가 있는 경우 매개변수, 반환값, 변수, 필드 등 객체를 참조하는 모든 곳을 인터페이스 타입으로 선언하자.
- 적합한 인터페이스가 없다면 클래스의 계층구조 중 필요한 기능을 만족하는 가장 상위 클래스를 타입으로 사용하자.

## 아이템 65: 리플렉션보다는 인터페이스를 사용하라

리플렉션은 강력하지만, 장황하고 오류를 만들기 쉽기 때문에 아주 제한된 형태로만 사용해야 한다.

리플렉션으로 인스턴스를 생성하는 경우 인터페이스나 상위 클래스로 참조해 사용하는 것이 좋다.

### 리플렉션의 단점

- 컴파일타임 타입 검사의 이점을 누릴 수 없다.
- 코드가 지저분하고 장황해진다.
- 성능이 떨어진다.

```java
// 리플렉션으로 활용한 인스턴스화 데모
public class ReflectiveInstantiation {
    // 코드 65-1 리플렉션으로 생성하고 인터페이스로 참조해 활용한다. (372-373쪽)
    public static void main(String[] args) {
        // 클래스 이름을 Class 객체로 변환
        Class<? extends Set<String>> cl = null;
        try {
            cl = (Class<? extends Set<String>>)  // 비검사 형변환!
                    Class.forName(args[0]);
        } catch (ClassNotFoundException e) {
            fatalError("클래스를 찾을 수 없습니다.");
        }

        // 생성자를 얻는다.
        Constructor<? extends Set<String>> cons = null;
        try {
            cons = cl.getDeclaredConstructor();
        } catch (NoSuchMethodException e) {
            fatalError("매개변수 없는 생성자를 찾을 수 없습니다.");
        }

        // 집합의 인스턴스를 만든다.
        Set<String> s = null;
        try {
            s = cons.newInstance();
        } catch (IllegalAccessException e) {
            fatalError("생성자에 접근할 수 없습니다.");
        } catch (InstantiationException e) {
            fatalError("클래스를 인스턴스화할 수 없습니다.");
        } catch (InvocationTargetException e) {
            fatalError("생성자가 예외를 던졌습니다: " + e.getCause());
        } catch (ClassCastException e) {
            fatalError("Set을 구현하지 않은 클래스입니다.");
        }

        // 생성한 집합을 사용한다.
        s.addAll(Arrays.asList(args).subList(1, args.length));
        System.out.println(s);
    }

    private static void fatalError(String msg) {
        System.err.println(msg);
        System.exit(1);
    }
}
```

## 아이템 66: 네이티브 메서드는 신중히 사용하라

자바는 JNI를 통해 네이티브 코드에 접근할 수 있지만, 사용에 신중해야 한다.

- 네이티브 메서드가 성능을 개선하는 일은 많지 않으며, 디버깅 용이성과 이식성을 저하시킨다.
- 네이티브 코드는 안전하지 않기 때문에 네이티브 메서드를 사용하는 애플리케이션도 메모리 훼손 오류로부터 안전하지 않다.

## 아이템 67: 최적화는 신중히 하라

- 빠른 프로그램보다는 좋은 프로그램이 낫다.
- 성능을 제한하는 설계를 피하라.
- API를 설계할 때 성능에 주는 영향을 고려하라.
    - 하지만 성능을 위해 API를 왜곡하면 안 된다.
- 최적화 시도 전후로 성능을 측정하자.

## 아이템 68: 일반적으로 통용되는 명명 규칙을 따르라

표준 명명 규칙을 습관화하자.