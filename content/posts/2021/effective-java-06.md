---
title: "이펙티브 자바 6장 정리"
date: 2021-04-15
tags: ["Study", "Java"]
---

## 아이템 34: int 상수 대신 열거 타입을 사용하라

Java 1.5 Enum 등장 전 사용되던 int enum 패턴

```java
public static final int APPLE_FUJI = 0;
public static final int APPLE_PIPPIN = 1;
public static final int APPLE_GRANNY_SMITH = 2;

public static final int ORANGE_NAVEL = 0;
public static final int ORANGE_TEMPLE = 1;
public static final int ORANGE_BLOOD = 2;
```

- 타입 안전을 보장할 방법이 없다.
- 표현 방식이 까다롭다.
    - toString(), 디버거 등에서는 그냥 아무 의미 없는 상수로 보인다.
- 그렇다고 문자열 상수를 사용하자니, 성능 저하 + 문자열 하드코딩의 위험이 있다.

→ Enum 타입을 사용하자.

```java
public enum Apple {
    FUJI, PIPPIN, GRANNY_SMITH
}
public enum Orange {
    NAVEL, TEMPLE, BLOOD
}
```

### Enum 타입의 장점

- Java의 Enum은 완전한 클래스이다.
- 밖에서 접근 가능한 생성자가 없기 때문에, 사실상 final이다.
    - 따라서 오직 하나만 존재함이 보장된다.
- 컴파일타임 타입 안전성을 제공한다.
- 출력하기에 적합한 문자열을 제공한다.

### 상수별 메서드 구현

```java
// 코드 34-6 상수별 클래스 몸체(class body)와 데이터를 사용한 열거 타입 (215-216쪽)
public enum Operation {
    PLUS("+") {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x / y; }
    };

    private final String symbol;

    Operation(String symbol) { this.symbol = symbol; }

    @Override public String toString() { return symbol; }

    public abstract double apply(double x, double y);

    // 코드 34-7 열거 타입용 fromString 메서드 구현하기 (216쪽)
    private static final Map<String, Operation> stringToEnum =
            Stream.of(values()).collect(
                    toMap(Object::toString, e -> e));

    // 지정한 문자열에 해당하는 Operation을 (존재한다면) 반환한다.
    public static Optional<Operation> fromString(String symbol) {
        return Optional.ofNullable(stringToEnum.get(symbol));
    }
```

### 전략 열거 타입 패턴

- enum 인스턴스별로 '전략'을 선택하도록 하는 것
- 열거 타입 상수 일부가 같은 동작을 공유할 때 유용하다.

```java
// 코드 34-9 전략 열거 타입 패턴 (218-219쪽)
enum PayrollDay {
    MONDAY(WEEKDAY), TUESDAY(WEEKDAY), WEDNESDAY(WEEKDAY),
    THURSDAY(WEEKDAY), FRIDAY(WEEKDAY),
    SATURDAY(WEEKEND), SUNDAY(WEEKEND);

    private final PayType payType;

    PayrollDay(PayType payType) { this.payType = payType; }
    
    int pay(int minutesWorked, int payRate) {
        return payType.pay(minutesWorked, payRate);
    }

    // 전략 열거 타입
    enum PayType {
        WEEKDAY {
            int overtimePay(int minsWorked, int payRate) {
                return minsWorked <= MINS_PER_SHIFT ? 0 :
                        (minsWorked - MINS_PER_SHIFT) * payRate / 2;
            }
        },
        WEEKEND {
            int overtimePay(int minsWorked, int payRate) {
                return minsWorked * payRate / 2;
            }
        };

        abstract int overtimePay(int mins, int payRate);
        private static final int MINS_PER_SHIFT = 8 * 60;

        int pay(int minsWorked, int payRate) {
            int basePay = minsWorked * payRate;
            return basePay + overtimePay(minsWorked, payRate);
        }
    }

    public static void main(String[] args) {
        for (PayrollDay day : values())
            System.out.printf("%-10s%d%n", day, day.pay(8 * 60, 1));
    }
}
```

- 필요한 원소를 컴파일타임에 다 알 수 있는 상수 집합이라면 항상 Enum을 사용하자.
- Enum의 상수 개수가 고정불변일 필요는 없다.
    - 나중에 상수가 추가되어도 바이너리 수준에서 호환되도록 설계되었기 때문

## 아이템 35: ordinal 메서드 대신 인스턴스 필드를 사용하라

- Enum 상수에 연결된 값은 Enum.ordinal() 메서드를 사용해서 얻으면 안 된다.
    - 상수 순서가 바뀔 경우 기존 코드가 깨지고, 중간에 값을 비워둘 수도 없다.
    - (DB에 저장할 때도 순서를 그대로 저장하면 안 된다.)

```java
public enum Ensemble{
	SOLO, DUET, TRIO, QUARTET, ..., OCTET;
	public int numberOfMusicians(){
		return ordinal() + 1;
	}
}

public enum Ensemble{
	SOLO(1), DUET(2), TRIO(3), QUARTET(4);
	
	private final int numberOfMusicians;
	
	Ensemble(int size) {
		this.numberOfMusicians = size;
	}
	
	public int numberOfMusicians(){
		return numberOfMusicians;
	}
}
```

## 아이템 36: 비트 필드 대신 EnumSet을 사용하라

열거 상수가 집합으로 사용할 경우, 예전에는 비트 필드 enum 패턴을 사용했다.

```java
public class Text {
    public static final int STYLE_BOLD          = 1 << 0; // 1
    public static final int STYLE_ITALIC        = 1 << 1; // 2
    public static final int STYLE_UNDERLINE     = 1 << 2; // 4
    public static final int STYLE_STRIKETHROUGH = 1 << 3; // 8

    // 매개변수 styles는 0개 이상의 STYLE_ 상수를 비트별 OR한 값이다.
    public void applyStyles(int styles) {...}
}

text.applyStyles(STYLE_BOLD | STYLE_ITALIC);
```

- String으로 출력하거나 디버거에서 의미를 직관적으로 인식하기 어렵다.
- 최대 몇 비트가 필요한지 예측해야 한다.

→ EnumSet을 사용하자.

- 내부 구현은 비트 필드와 유사한 형태로 구현되어 있어 효율성과 안전성 모두 만족한다.

```java
public class Text {
    public enum Style { BOLD, ITALIC, UNDERLINE, STRIKETHROUGH }

    public void applyStyles(Set<Style> styles) {...}
}

text.applyStyles(EnumSet.of(Style.BOLD, Style.ITALIC));
```

## 아이템 37: ordinal 인덱싱 대신 EnumMap을 사용하라

Enum.ordinal() 메서드를 배열 인덱스로 사용하면 위험하다.

```java
Set<Plant>[] plantByLifeCycle =
    (Set<Plant>[]) new Set[Plant.LifeCycle.values().length];

for (int i = 0; i < plantsByLifeCycle.length; i++) {
    plantsByLifeCycle[i] = new HashSet<>();
}

for (plant p : garden) {
    plantsByLifeCycle[p.lifeCycle.ordinal()].add(p);
}

// 결과 출력
for (int i = 0; i < plantsByLifeCycle.length; i++) {
    System.out.printf("%s: %s%n", Plant.LifeCycle.values()[i], plantsByLifeCycle[i]);
}
```

- 비검사 형변환을 수행한다.
- 배열을 직접 사용했기 때문에 각 인덱스의 의미를 설명하는 레이블을 직접 달아야 한다.
- 정확한 정수값을 사용한다는 것을 직접 보증해야 한다.
    - ordinal()은 상수 선언 순서에 따라 반환값이 바뀐다.

→ EnumMap을 사용하자.

### **EnumMap**

열거 타입을 키로 사용하도록 설계된 아주 빠른 Map 구현체

```java
Map<Plant.LifeCycle, Set<Plant>> plantsByLifeCycle =
    new EnumMap<>(Plant.LifeCycle.class);

for (Plant.LifeCycle lc : Plant.LifeCycle.values()) {
    plantsByLifeCycle.put(lc, new HashSet<>());
}

for (Plant p : garden) {
    plantsByLifeCycle.get(p.lifeCycle).add(p);
}
System.out.println(plantsByLifeCycle);
```

- 내부 구현 방식을 숨겨 배열 사용 시의 성능과 Map의 타입 안정성을 모두 만족한다.
- 맵의 키인 열거 타입이 그 자체로 출력용 문자열을 제공한다.

스트림을 사용해 맵을 관리하면 코드를 더 줄일 수 있다.

```java
//HashMap을 이용한 데이터와 열거타입 매핑
Arrays.stream(garden)
    .collect(groupingBy(p -> p.lifeCycle))

//EnumMap을 이용해 데이터와 열거타입 매핑
Arrays.stream(garden)
    .collect(groupingBy(
        p -> p.lifeCycle,
        () -> new EnumMap<>(LifeCycle.class), toSet())
    );
```

다차원 관계는 중첩된 EnumMap으로 표현할 수 있다.

```java
// 코드 37-5 배열들의 배열의 인덱스에 ordinal()을 사용 - 따라 하지 말 것!

public enum Phase {
    SOLID, LIQUID, GAS;

    public enum Transition {
	MELT, FREEZE, BOIL, CONDENSE, SUBLIME, DEPOSIT;

	// 행은 from의 ordinal을, 열은 to의 ordinal을 인덱스로 쓴다.
	private static final Transition[][] TRANSITIONS = {
	    { null, MELT, SUBLIME },
	    { FREEZE, null, BOIL },
	    { DEPOSIT, CONDENSE, null }
	};

	// 한 상태에서 다른 상태로의 전이를 반환한다.
	public static Transition from(Phase from, Phase to) {
	    return TRANSITIONS[from.ordinal()][to.ordinal()];
	}
    }
}
```

```java
// 코드 37-6 중첩 EnumMap으로 데이터와 열거 타입 쌍을 연결했다.

public enum Phase {
    SOLID, LIQUID, GAS;

    public enum Transition {
	MELT(SOLID, LIQUID), FREEBZ(LIQUID, SOLID),
	BOIL(LIQUID, GAS), CONDENSE(GAS, LIQUID),
	SUBLIME(SOLID, GAS), DEPOSIT(GAS, SOLID);

	private final Phase from;
	private final Phase to;

	Transition(Phase from, Phase to) {
	    this.from = from;
	    this.to = to;
	}

	// 상전이 맵을 초기화한다.
	private static final Map<Phase, Map<Phase, Transition>>
	  m = Stream.of(values()).collect(groupingBy(t -> t.from,
	    () -> new EnumMap<>(Phase.class),
            toMap(t -> t.to, t -> t,
		  (x, y) -> y, () -> new EnumMap<>(Phase.class))));

	public static Transition from(Phase from, Phase to) {
	    return m.get(from).get(to);
	}
    }
}
```

## 아이템 38: 확장할 수 있는 열거 타입이 필요하면 인터페이스를 사용하라

Enum을 확장하는 것은 일반적으로 좋지 않은 생각이지만, 필요할 경우 인터페이스를 이용할 수 있다.

- 기존 Enum을 인터페이스를 구현하도록 만든 뒤, 확장할 Enum은 해당 인터페이스를 구현한 새로운 Enum으로 구성
- 사용 시에는 인터페이스를 참조한다.

```java
public interface Operation {
    double apply(double x, double y);
}

public enum BasicOperation implements Operation {
    PLUS("+") {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x / y; }
    };

    private final String symbol;
}
```

```java
public enum ExtendedOperation implements Operation {
    EXP("^") {
        public double apply(double x, double y) {
            return Math.pow(x, y);
        }
    },
    REMAINDER("%") {
        public double apply(double x, double y) {
            return x % y;
        }
    };

    private final String symbol;
}
```

```java
public static void main(String[] args) {
    double x = Double.parseDouble(args[0]);
    double y = Double.parseDouble(args[1]);
    test(ExtendedOperation.class, x, y);
}

private static <T extends Enum<T> & Operation> void test(Class<T> opEnumType, double x, double y) {
    for (Operation op : opEnumType.getEnumConstants()) {
        System.out.printf("%f %s %f = %f%n", x, op, y, op.apply(x, y));
    }
}
```

Enum은 final이므로 구현을 상속할 수 없기 때문에, 코드 중복이 많아지는 경우 헬퍼 클래스로 분리하는 것이 좋다.

## 아이템 39: 명명패턴보다 애너테이션을 사용하라

도구나 프레임워크가 특별히 다루어야 할 프로그램 요소에는 전통적으로 구분되는 명명 패턴을 사용

e.g. JUnit 3: 모든 테스트 메서드는 test로 시작해야 한다.

- 오타에 취약하다.
- 올바른 프로그램 요소에서만 사용될 보장이 없다.
- 프로그램 요소를 매개변수로 전달할 마땅한 방법이 없다.

→ 애너테이션을 사용하자.

```java
// 코드 39-1 마커(marker) 애너테이션 타입 선언 (238쪽)
import java.lang.annotation.*;

/**
 * 테스트 메서드임을 선언하는 애너테이션이다.
 * 매개변수 없는 정적 메서드 전용이다.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
}

// 코드 39-2 마커 애너테이션을 사용한 프로그램 예 (239쪽)
public class Sample {
    @Test
    public static void m1() { }        // 성공해야 한다.
    public static void m2() { }
    @Test public static void m3() {    // 실패해야 한다.
        throw new RuntimeException("실패");
    }
    public static void m4() { }  // 테스트가 아니다.
    @Test public void m5() { }   // 잘못 사용한 예: 정적 메서드가 아니다.
    public static void m6() { }
    @Test public static void m7() {    // 실패해야 한다.
        throw new RuntimeException("실패");
    }
    public static void m8() { }
}

public class RunTests {
    public static void main(String[] args) throws Exception {
        int tests = 0;
        int passed = 0;
        Class<?> testClass = Class.forName(args[0]);
        for (Method m : testClass.getDeclaredMethods()) {
            if (m.isAnnotationPresent(Test.class)) {
                tests++;
                try {
                    m.invoke(null);
                    passed++;
                } catch (InvocationTargetException wrappedExc) {
                    Throwable exc = wrappedExc.getCause();
                    System.out.println(m + " 실패: " + exc);
                } catch (Exception exc) {
                    System.out.println("잘못 사용한 @Test: " + m);
                }
            }
        }
        System.out.printf("성공: %d, 실패: %d%n",
                passed, tests - passed);
    }
}
```

### 애너테이션의 의미

- 애너테이션은 클래스의 의미에 직접 영향을 주지는 않는다.
- 애너테이션에 관심 있는 프로그램에 추가 정보를 제공할 뿐이다.

### 메타 애너테이션

애너테이션 선언에 다는 애너테이션

- @Retention: 애너테이션의 범위를 지정한다.
    - RUNTIME, CLASS, SOURCE
- @Target: 애너테이션이 적용될 수 있는 위치를 제한한다.
    - PACKAGE, TYPE, CONSTRUCTOR, FIELD, METHOD, ANNOTATION_TYPE, LOCAL_VARIABLE, PARAMETER, TYPE_PARAMETER, TYPE_USE
- @Inherited: 자식 클래스가 부모 클래스에 달린 애너테이션을 가지도록 한다.
- @Repeatable: 반복해서 동일한 애너테이션을 달 수 있다. (후술)

### 매개변수를 받는 애너테이션

```java
/**
 * 명시한 예외를 던져야만 성공하는 테스트 메서드용 애너테이션
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTest {
    Class<? extends Throwable> value();
}

// 코드 39-5 매개변수 하나짜리 애너테이션을 사용한 프로그램 (241쪽)
public class Sample2 {
    @ExceptionTest(ArithmeticException.class)
    public static void m1() {  // 성공해야 한다.
        int i = 0;
        i = i / i;
    }
    @ExceptionTest(ArithmeticException.class)
    public static void m2() {  // 실패해야 한다. (다른 예외 발생)
        int[] a = new int[0];
        int i = a[1];
    }
    @ExceptionTest(ArithmeticException.class)
    public static void m3() { }  // 실패해야 한다. (예외가 발생하지 않음)
}

// 마커 애너테이션과 매개변수 하나짜리 애너태이션을 처리하는 프로그램 (241-242쪽)
public class RunTests {
    public static void main(String[] args) throws Exception {
        int tests = 0;
        int passed = 0;
        Class<?> testClass = Class.forName(args[0]);
        for (Method m : testClass.getDeclaredMethods()) {
            if (m.isAnnotationPresent(Test.class)) {
                tests++;
                try {
                    m.invoke(null);
                    passed++;
                } catch (InvocationTargetException wrappedExc) {
                    Throwable exc = wrappedExc.getCause();
                    System.out.println(m + " 실패: " + exc);
                } catch (Exception exc) {
                    System.out.println("잘못 사용한 @Test: " + m);
                }
            }

            if (m.isAnnotationPresent(ExceptionTest.class)) {
                tests++;
                try {
                    m.invoke(null);
                    System.out.printf("테스트 %s 실패: 예외를 던지지 않음%n", m);
                } catch (InvocationTargetException wrappedEx) {
                    Throwable exc = wrappedEx.getCause();
                    Class<? extends Throwable> excType =
                            m.getAnnotation(ExceptionTest.class).value();
                    if (excType.isInstance(exc)) {
                        passed++;
                    } else {
                        System.out.printf(
                                "테스트 %s 실패: 기대한 예외 %s, 발생한 예외 %s%n",
                                m, excType.getName(), exc);
                    }
                } catch (Exception exc) {
                    System.out.println("잘못 사용한 @ExceptionTest: " + m);
                }
            }
        }

        System.out.printf("성공: %d, 실패: %d%n",
                passed, tests - passed);
    }
}
```

### 배열 매개변수 애너테이션

- 매개변수를 배열로 받거나, @Repeatable 메타 애너테이션을 사용해 여러 개의 파라미터를 받을 수 있다.
    - 배열로 선언된 매개변수에 하나만 전달하는 경우에는 중괄호로 묶어줄 필요가 없다.

### 반복 가능 애너테이션

자바 8부터 도입된 @Repeatable 메타 애너테이션을 적용하면 같은 애너테이션을 여러 번 적용할 수 있다.

- @Repeatable을 단 애너테이션을 반환하는 컨테이너 애너테이션을 하나 더 정의하고, 컨테이너 애너테이션의 class 객체를 매개변수로 전달해야 한다.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(ExceptionTestContainer.class)
public @interface ExceptionTest {
    Class<? extends Throwable> value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTestContainer {
    ExceptionTest[] value();
}
```

- 컨테이너 애너테이션 타입에는 적절한 보존 정책과 적용 대상 (@Retention, @Target)을 명시해야 한다.
- 반복 가능 애너테이션을 하나만 달았을 때와 여러 번 달았을 때는 다른 애너테이션 타입이 적용된다.
    - 메서드별로 동작이 달라지기 때문에 주의해야 한다.
    - getAnnotationByType은 구분하지 않지만,  isAnnotationPresent 메서드는 구분한다.

    ```java
    public class RunTests {
        public static void main(String[] args) throws Exception {
            int tests = 0;
            int passed = 0;
            Class testClass = Class.forName(args[0]);
            for (Method m : testClass.getDeclaredMethods()) {
                if (m.isAnnotationPresent(Test.class)) {
                    tests++;
                    try {
                        m.invoke(null);
                        passed++;
                    } catch (InvocationTargetException wrappedExc) {
                        Throwable exc = wrappedExc.getCause();
                        System.out.println(m + " 실패: " + exc);
                    } catch (Exception exc) {
                        System.out.println("잘못 사용한 @Test: " + m);
                    }
                }

                // 코드 39-10 반복 가능 애너테이션 다루기 (244-245쪽)
                if (m.isAnnotationPresent(ExceptionTest.class)
                        || m.isAnnotationPresent(ExceptionTestContainer.class)) {
                    tests++;
                    try {
                        m.invoke(null);
                        System.out.printf("테스트 %s 실패: 예외를 던지지 않음%n", m);
                    } catch (Throwable wrappedExc) {
                        Throwable exc = wrappedExc.getCause();
                        int oldPassed = passed;
                        ExceptionTest[] excTests =
                                m.getAnnotationsByType(ExceptionTest.class);
                        for (ExceptionTest excTest : excTests) {
                            if (excTest.value().isInstance(exc)) {
                                passed++;
                                break;
                            }
                        }
                        if (passed == oldPassed)
                            System.out.printf("테스트 %s 실패: %s %n", m, exc);
                    }
                }
            }
            System.out.printf("성공: %d, 실패: %d%n",
                              passed, tests - passed);
        }
    ```

> 애너테이션으로 할 수 있는 일을 명명 패턴으로 처리할 이유는 없다.

## 아이템 40: @Override 애너테이션을 일관되게 사용하라

상위 타입의 메서드를 재정의했음을 뜻하는 @Override 메서드를 일관되게 사용하면 많은 버그를 예방할 수 있다.

```java
// 코드 40-1 영어 알파벳 2개로 구성된 문자열(바이그램)을 표현하는 클래스 - 버그를 찾아보자. (246쪽)
public class Bigram {
    private final char first;
    private final char second;

    public Bigram(char first, char second) {
        this.first  = first;
        this.second = second;
    }

    public boolean equals(Bigram b) {
        return b.first == first && b.second == second;
    }

    public int hashCode() {
        return 31 * first + second;
    }

    public static void main(String[] args) {
        Set<Bigram> s = new HashSet<>();
        for (int i = 0; i < 10; i++)
            for (char ch = 'a'; ch <= 'z'; ch++)
                s.add(new Bigram(ch, ch));
        System.out.println(s.size());
    }
}
```

- equals() 메서드의 파라미터 타입을 Object로 선언하지 않아 메서드 재정의가 아니라 다중정의가 되어 예상하지 않은 방식으로 작동한다.

→ 상위 클래스의 메서드를 재정의하고자 하는 모든 곳에 @Override 애너테이션을 붙이면 컴파일 타임에 실수를 예방할 수 있다.

## 아이템 41: 정의하려는 것이 타입이라면 마커 인터페이스를 사용하라

마커 인터페이스와 마커 애너테이션은 각자의 쓰임이 있다.

### 마커 인터페이스의 장점

- 마커 인터페이스는 구현한 클래스의 인스턴스를 구분하는 타입으로 쓸 수 있으나, 애너테이션은 그렇지 않다.
- 적용 대상을 좀 더 정밀하게 지정할 수 있다.

### 마커 애너테이션의 장점

- 애너테이션 프레임워크의 지원을 받을 수 있다.

→ 마킹이 된 객체를 매개변수로 받는 메서드를 작성할 일이 있다면 인터페이스로, 그렇지 않다면 애너테이션으로 작성하자.